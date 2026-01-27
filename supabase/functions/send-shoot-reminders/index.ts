import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Starting shoot reminder check...');

    // Get current time and calculate 24 hour window
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD for date comparison
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`Checking for shoots on: ${tomorrowStr}`);

    // Get all shoots scheduled for tomorrow
    const { data: shoots, error: shootsError } = await supabase
      .from('shoots')
      .select('*')
      .eq('shoot_date', tomorrowStr)
      .in('status', ['pending', 'in_progress']);

    if (shootsError) {
      console.error('Error fetching shoots:', shootsError);
      throw shootsError;
    }

    if (!shoots || shoots.length === 0) {
      console.log('No shoots scheduled for tomorrow');
      return new Response(
        JSON.stringify({ success: true, message: 'No shoots scheduled for tomorrow', notificationsSent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${shoots.length} shoots scheduled for tomorrow`);

    let totalNotificationsSent = 0;
    const errors: string[] = [];

    for (const shoot of shoots) {
      // Get all assigned team members for this shoot
      const { data: assignments, error: assignmentsError } = await supabase
        .from('shoot_assignments')
        .select('user_id')
        .eq('shoot_id', shoot.id);

      if (assignmentsError) {
        console.error(`Error fetching assignments for shoot ${shoot.id}:`, assignmentsError);
        errors.push(`Failed to get assignments for shoot ${shoot.id}`);
        continue;
      }

      if (!assignments || assignments.length === 0) {
        console.log(`No team members assigned to shoot: ${shoot.event_name}`);
        continue;
      }

      console.log(`Sending reminders to ${assignments.length} team members for shoot: ${shoot.event_name}`);

      // Format shoot time for display
      const shootTime = shoot.shoot_time ? shoot.shoot_time.substring(0, 5) : 'TBD';
      const shootDate = new Date(shoot.shoot_date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      for (const assignment of assignments) {
        try {
          // Check notification preferences
          const { data: prefs } = await supabase
            .rpc('get_or_create_notification_preferences', { _user_id: assignment.user_id });

          if (prefs && !prefs.shoot_notifications) {
            console.log(`User ${assignment.user_id} has shoot notifications disabled`);
            continue;
          }

          // Create in-app notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: assignment.user_id,
              title: 'Shoot Reminder - Tomorrow',
              message: `You have a shoot tomorrow: ${shoot.event_name} for ${shoot.brand_name} at ${shoot.location} (${shootTime})`,
              notification_type: 'shoot_reminder',
              reference_id: shoot.id,
              reference_type: 'shoot',
            });

          if (notifError) {
            console.error(`Error creating notification for user ${assignment.user_id}:`, notifError);
            errors.push(`Failed to create notification for user ${assignment.user_id}`);
            continue;
          }

          // Send push notification if enabled
          if (prefs?.push_enabled !== false) {
            try {
              await supabase.functions.invoke('send-push-notification', {
                body: {
                  userId: assignment.user_id,
                  title: '📸 Shoot Reminder - Tomorrow',
                  body: `${shoot.event_name} for ${shoot.brand_name} at ${shoot.location} (${shootTime})`,
                  data: {
                    type: 'shoot_reminder',
                    shootId: shoot.id,
                    url: '/shoots'
                  }
                }
              });
            } catch (pushError) {
              console.error(`Error sending push notification to user ${assignment.user_id}:`, pushError);
              // Don't add to errors - push is best-effort
            }
          }

          totalNotificationsSent++;
          console.log(`Notification sent to user ${assignment.user_id} for shoot ${shoot.event_name}`);
        } catch (userError) {
          console.error(`Error processing user ${assignment.user_id}:`, userError);
          errors.push(`Failed to process user ${assignment.user_id}`);
        }
      }
    }

    console.log(`Completed. Total notifications sent: ${totalNotificationsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${totalNotificationsSent} shoot reminder notifications`,
        notificationsSent: totalNotificationsSent,
        shootsProcessed: shoots.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-shoot-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
