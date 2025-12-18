-- ============================================
-- RLS POLICIES FOR PHASES 10-12
-- ============================================

-- 1. Push Devices - Users can only see/manage their own devices
ALTER TABLE public.poussoirs_appareils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
  ON public.poussoirs_appareils FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own devices"
  ON public.poussoirs_appareils FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own devices"
  ON public.poussoirs_appareils FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own devices"
  ON public.poussoirs_appareils FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Notification Queue - Users can only see their own notifications
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notification_queue FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Offline Actions - Users can only manage their own offline actions
ALTER TABLE public.offline_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own offline actions"
  ON public.offline_actions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own offline actions"
  ON public.offline_actions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own offline actions"
  ON public.offline_actions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. User Interactions - Users can only see their own interactions
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Partial index for pending notifications only
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
  ON public.notification_queue(created_at) 
  WHERE status = 'pending';

-- Partial index for active devices only
CREATE INDEX IF NOT EXISTS idx_push_devices_active_lookup 
  ON public.poussoirs_appareils(user_id, platform) 
  WHERE is_active = true;

-- ============================================
-- REALTIME BROADCAST ON NOTIFICATION CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION public.broadcast_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Broadcast to user's personal notification channel
  PERFORM pg_notify(
    'user:' || NEW.user_id || ':notifications',
    json_build_object(
      'type', 'new_notification',
      'id', NEW.id,
      'title', NEW.title,
      'body', NEW.body,
      'data', NEW.data
    )::text
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_broadcast_notification ON public.notification_queue;
CREATE TRIGGER trigger_broadcast_notification
  AFTER INSERT ON public.notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_notification();
