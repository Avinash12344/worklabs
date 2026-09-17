import { supabase } from './supabase.js';

type NotificationPayload = Record<string, unknown>;

type CreateNotificationInput = {
  userId: string;
  type: string;
  payload: NotificationPayload;
};

/**
 * Insert a notification for a user.
 * Non-blocking — we don't want a notification failure to break the request.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      payload: input.payload,
    });

    if (error) {
      console.error('[notification] insert failed:', error.message);
    }
  } catch (err) {
    console.error('[notification] unexpected error:', err);
  }
}