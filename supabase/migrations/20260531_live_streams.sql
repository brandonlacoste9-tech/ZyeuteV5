CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Live en cours',
  description TEXT,
  mux_stream_id TEXT,
  mux_playback_id TEXT,
  stream_key TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  region TEXT DEFAULT 'montreal',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active streams" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Users can manage own streams" ON live_streams FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access live_streams" ON live_streams FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Live chat messages
CREATE TABLE IF NOT EXISTS live_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat', 'gift', 'join', 'system')),
  gift_name TEXT,
  gift_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_messages_stream_id ON live_messages(stream_id);
ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view live messages" ON live_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert messages" ON live_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access live_messages" ON live_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
