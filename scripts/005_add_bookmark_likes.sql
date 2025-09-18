-- Add bookmark_likes table for persistent like support
CREATE TABLE IF NOT EXISTS public.bookmark_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (bookmark_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmark_likes_bookmark_id ON public.bookmark_likes(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_likes_user_id ON public.bookmark_likes(user_id);

-- RLS policies
ALTER TABLE public.bookmark_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own likes" ON public.bookmark_likes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own likes" ON public.bookmark_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.bookmark_likes
  FOR DELETE USING (auth.uid() = user_id);
