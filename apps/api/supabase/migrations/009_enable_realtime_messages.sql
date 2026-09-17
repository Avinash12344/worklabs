-- ============================================================
-- Migration: 009_enable_realtime_messages
-- Description: Add messages table to Supabase Realtime publication
-- Created: <today's date>
-- ============================================================

-- Supabase creates a publication called supabase_realtime
-- Adding a table to it enables realtime broadcasts for that table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;