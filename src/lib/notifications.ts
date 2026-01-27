import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
}

interface NotificationPreferences {
  leave_notifications: boolean;
  extra_work_notifications: boolean;
  shoot_notifications: boolean;
  task_notifications: boolean;
  salary_notifications: boolean;
  push_enabled: boolean;
}

/**
 * Check if a notification type is enabled for a user
 */
function isNotificationTypeEnabled(type: NotificationType, prefs: NotificationPreferences): boolean {
  switch (type) {
    case 'leave_request':
    case 'request_approved':
    case 'request_rejected':
      return prefs.leave_notifications;
    case 'extra_work_request':
      return prefs.extra_work_notifications;
    case 'shoot_reminder':
      return prefs.shoot_notifications;
    case 'missing_tod':
    case 'missing_eod':
      return prefs.task_notifications;
    case 'salary_generated':
      return prefs.salary_notifications;
    default:
      return true;
  }
}

/**
 * Get notification preferences for a user
 */
async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_or_create_notification_preferences', { _user_id: userId });
    
    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
    
    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Send a push notification to a user
 */
async function sendPushNotification(userId: string, title: string, body: string) {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: { userId, title, body },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw - push notifications are best-effort
  }
}

/**
 * Create a notification for a specific user (respects preferences)
 */
export async function createNotification(data: NotificationData) {
  try {
    // Check user preferences
    const prefs = await getNotificationPreferences(data.userId);
    
    // If we can't get preferences, default to sending
    if (prefs && !isNotificationTypeEnabled(data.type, prefs)) {
      console.log(`Notification type ${data.type} disabled for user ${data.userId}`);
      return { success: true, skipped: true };
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        notification_type: data.type,
        reference_id: data.referenceId || null,
        reference_type: data.referenceType || null,
      });

    if (error) throw error;
    
    // Send push notification if enabled
    if (prefs?.push_enabled !== false) {
      await sendPushNotification(data.userId, data.title, data.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create notifications for leave request events
 */
export async function notifyLeaveRequest(
  adminUserIds: string[],
  employeeName: string,
  leaveType: string,
  leaveId: string
) {
  const promises = adminUserIds.map(adminId =>
    createNotification({
      userId: adminId,
      title: 'New Leave Request',
      message: `${employeeName} has requested ${leaveType} leave`,
      type: 'leave_request',
      referenceId: leaveId,
      referenceType: 'leave',
    })
  );
  await Promise.all(promises);
}

/**
 * Create notification for approved request
 */
export async function notifyRequestApproved(
  userId: string,
  requestType: 'leave' | 'extra_work',
  requestId: string
) {
  const typeLabel = requestType === 'leave' ? 'Leave request' : 'Extra work request';
  await createNotification({
    userId,
    title: 'Request Approved',
    message: `Your ${typeLabel.toLowerCase()} has been approved`,
    type: 'request_approved',
    referenceId: requestId,
    referenceType: requestType,
  });
}

/**
 * Create notification for rejected request
 */
export async function notifyRequestRejected(
  userId: string,
  requestType: 'leave' | 'extra_work',
  requestId: string,
  reason?: string
) {
  const typeLabel = requestType === 'leave' ? 'Leave request' : 'Extra work request';
  await createNotification({
    userId,
    title: 'Request Rejected',
    message: reason 
      ? `Your ${typeLabel.toLowerCase()} was rejected: ${reason}`
      : `Your ${typeLabel.toLowerCase()} was rejected`,
    type: 'request_rejected',
    referenceId: requestId,
    referenceType: requestType,
  });
}

/**
 * Create notification for extra work request
 */
export async function notifyExtraWorkRequest(
  adminUserIds: string[],
  employeeName: string,
  hours: number,
  requestId: string
) {
  const promises = adminUserIds.map(adminId =>
    createNotification({
      userId: adminId,
      title: 'New Extra Work Request',
      message: `${employeeName} has requested ${hours} hour(s) of extra work compensation`,
      type: 'extra_work_request',
      referenceId: requestId,
      referenceType: 'extra_work',
    })
  );
  await Promise.all(promises);
}

/**
 * Create shoot reminder notification
 */
export async function notifyShootReminder(
  userId: string,
  shootName: string,
  shootDate: string,
  shootId: string
) {
  await createNotification({
    userId,
    title: 'Shoot Reminder',
    message: `You have a shoot scheduled: ${shootName} on ${shootDate}`,
    type: 'shoot_reminder',
    referenceId: shootId,
    referenceType: 'shoot',
  });
}

/**
 * Create missing TOD notification
 */
export async function notifyMissingTod(userId: string, date: string) {
  await createNotification({
    userId,
    title: 'Missing TOD',
    message: `You haven't submitted your Task Of Day for ${date}`,
    type: 'missing_tod',
  });
}

/**
 * Create missing EOD notification
 */
export async function notifyMissingEod(userId: string, date: string) {
  await createNotification({
    userId,
    title: 'Missing EOD',
    message: `You haven't submitted your End Of Day report for ${date}`,
    type: 'missing_eod',
  });
}

/**
 * Create salary generated notification
 */
export async function notifySalaryGenerated(
  userId: string,
  period: string,
  salaryId: string
) {
  await createNotification({
    userId,
    title: 'Salary Generated',
    message: `Your salary for ${period} has been generated. View details in your salary records.`,
    type: 'salary_generated',
    referenceId: salaryId,
    referenceType: 'salary',
  });
}
