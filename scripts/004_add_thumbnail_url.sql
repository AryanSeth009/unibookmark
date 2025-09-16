-- Add thumbnail_url column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add index for thumbnail_url for better performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_thumbnail_url ON public.bookmarks(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
