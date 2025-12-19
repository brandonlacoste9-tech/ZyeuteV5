-- Protocol Security Hardening Migration
-- Applies RLS, Realtime Policies, and Triggers for offline/background reliability

-- 1. Hardening User Profiles
-- Ensure users can always read their own profile (even if public access is restricted later)
DROP POLICY IF EXISTS "profile_self_read" ON public.user_profiles;
CREATE POLICY "profile_self_read" ON public.user_profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- 2. Realtime Messages Policies
-- Secure the realtime.messages table (used for broadcast/presence)
-- Allow users to subscribe to their own private channel
DROP POLICY IF EXISTS "user_can_receive_user_topic" ON realtime.messages;
CREATE POLICY "user_can_receive_user_topic" ON realtime.messages
FOR SELECT TO authenticated
USING (
  recipient_id::text = auth.uid()::text -- Note: Recipient check based on Realtime implementation intricacies
  OR (
     topic LIKE 'user:%:notifications'
     AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
  )
);

DROP POLICY IF EXISTS "user_can_send_user_topic" ON realtime.messages;
CREATE POLICY "user_can_send_user_topic" ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
  topic LIKE 'user:%:notifications'
  AND SPLIT_PART(topic, ':', 2)::uuid = auth.uid()
);

-- 3. Broadcast Trigger for Notification Queue
-- Automatically pushes new notifications to the path 'user:UID:notifications' via Realtime

CREATE OR REPLACE FUNCTION public.broadcast_user_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Broadcast the event to the specific user channel
  PERFORM realtime.broadcast_changes(
    'user:' || NEW.user_id::text || ':notifications', -- topic
    'INSERT', -- event
    'INSERT', -- type
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    row_to_json(NEW)::jsonb, -- payload
    NULL
  );
  RETURN NEW;
END;
$$;

-- Secure the function
REVOKE ALL ON FUNCTION public.broadcast_user_notifications() FROM PUBLIC, anon, authenticated;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_broadcast_user_notifications ON public.notifications;
CREATE TRIGGER trg_broadcast_user_notifications
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_user_notifications();

-- 4. RLS for Critical Tables

-- Device Tokens (Push Notifications)
ALTER TABLE public.poussoirs_appareils ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poussoirs_appareils_own_select" ON public.poussoirs_appareils;
CREATE POLICY "poussoirs_appareils_own_select" ON public.poussoirs_appareils
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "poussoirs_appareils_own_insert" ON public.poussoirs_appareils;
CREATE POLICY "poussoirs_appareils_own_insert" ON public.poussoirs_appareils
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "poussoirs_appareils_own_delete" ON public.poussoirs_appareils;
CREATE POLICY "poussoirs_appareils_own_delete" ON public.poussoirs_appareils
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- User Interactions (Analytics)
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interactions_own_insert" ON public.user_interactions;
CREATE POLICY "interactions_own_insert" ON public.user_interactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Everyone (or at least admins/analytics) might need to read, but for now restrict to own
DROP POLICY IF EXISTS "interactions_own_read" ON public.user_interactions;
CREATE POLICY "interactions_own_read" ON public.user_interactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Colony Tasks (AI Swarm)
-- Only allow the orchestrator (service role) or admins to manage tasks generally
-- usage by users is usually indirect via API (which runs as service role or user context?)
-- If users insert tasks directly (rare), they need policies.
-- Assuming tasks are mostly backend-managed, we'll ensure RLS is enabled to block anon access.
ALTER TABLE public.colony_tasks ENABLE ROW LEVEL SECURITY;

-- Allow read if it's your own task (if we tracked creator_id, but current schema doesn't have explicit user id, only origin)
-- For now, we block anon/authenticated direct access unless policy added later.
-- Service role always bypasses RLS.

