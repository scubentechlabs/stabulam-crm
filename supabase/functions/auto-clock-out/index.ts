 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Get current date in IST (UTC+5:30)
     const now = new Date();
     const istOffset = 5.5 * 60 * 60 * 1000;
     const istNow = new Date(now.getTime() + istOffset);
     const todayIST = istNow.toISOString().split('T')[0];
     
     console.log(`[auto-clock-out] Running at ${istNow.toISOString()} (IST), today: ${todayIST}`);
 
    // Get all admin user IDs to exclude them
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('[auto-clock-out] Error fetching admin roles:', adminError);
      throw adminError;
    }

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];
    console.log(`[auto-clock-out] Excluding ${adminUserIds.length} admin users`);

     // Find all attendance records where:
     // 1. clock_in_time exists
     // 2. clock_out_time is null
     // 3. date is before today (past dates)
    // 4. user is NOT an admin
    let query = supabase
       .from('attendance')
       .select(`
         id,
         user_id,
         date,
        clock_in_time
       `)
       .not('clock_in_time', 'is', null)
       .is('clock_out_time', null)
       .lt('date', todayIST);
 
    // Exclude admin users if there are any
    if (adminUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
    }

    const { data: openAttendance, error: fetchError } = await query;

     if (fetchError) {
       console.error('[auto-clock-out] Error fetching open attendance:', fetchError);
       throw fetchError;
     }
 
    console.log(`[auto-clock-out] Found ${openAttendance?.length || 0} employee records needing auto clock-out`);
 
     if (!openAttendance || openAttendance.length === 0) {
       return new Response(
         JSON.stringify({ 
           success: true, 
           message: 'No records need auto clock-out',
           processed: 0 
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Get profiles for work_end_time
     const userIds = [...new Set(openAttendance.map(a => a.user_id))];
     const { data: profiles, error: profileError } = await supabase
       .from('profiles')
       .select('user_id, work_end_time, full_name')
       .in('user_id', userIds);
 
     if (profileError) {
       console.error('[auto-clock-out] Error fetching profiles:', profileError);
       throw profileError;
     }
 
     const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
 
     // Process each open attendance record
     const results: { id: string; user: string; date: string; status: string }[] = [];
 
     for (const record of openAttendance) {
       const profile = profileMap.get(record.user_id);
       const workEndTime = profile?.work_end_time || '19:00:00';
       
      // Create clock_out_time as date + work_end_time + 30 minutes in IST, then convert to UTC
       // The date is stored as YYYY-MM-DD, work_end_time as HH:MM:SS
       const clockOutDateTimeIST = `${record.date}T${workEndTime}+05:30`;
      const clockOutDate = new Date(clockOutDateTimeIST);
      // Add 30 minutes
      clockOutDate.setMinutes(clockOutDate.getMinutes() + 30);
      const clockOutUTC = clockOutDate.toISOString();
 
      console.log(`[auto-clock-out] Processing: ${profile?.full_name || record.user_id} - ${record.date}, work_end: ${workEndTime}, setting clock_out to ${clockOutUTC} (end time + 30min)`);
 
      // Get the existing notes first
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('notes')
        .eq('id', record.id)
        .single();

      const existingNotes = existingRecord?.notes || '';
      const updatedNotes = existingNotes ? `${existingNotes} | Auto clock-out applied` : 'Auto clock-out applied';

       const { error: updateError } = await supabase
         .from('attendance')
         .update({ 
           clock_out_time: clockOutUTC,
          notes: updatedNotes
         })
         .eq('id', record.id);
 
       if (updateError) {
         console.error(`[auto-clock-out] Error updating ${record.id}:`, updateError);
         results.push({ 
           id: record.id, 
           user: profile?.full_name || record.user_id, 
           date: record.date, 
           status: 'error' 
         });
       } else {
         console.log(`[auto-clock-out] Successfully updated ${record.id}`);
         results.push({ 
           id: record.id, 
           user: profile?.full_name || record.user_id, 
           date: record.date, 
           status: 'success' 
         });
       }
     }
 
     const successCount = results.filter(r => r.status === 'success').length;
     
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: `Auto clock-out completed`,
         processed: successCount,
         total: openAttendance.length,
         results 
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error) {
     console.error('[auto-clock-out] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });