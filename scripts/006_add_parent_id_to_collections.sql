-- Add parent_id column to collections table
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;

-- Create index for parent_id for better performance
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id) WHERE parent_id IS NOT NULL;

-- Update RLS policy for collections to allow viewing their own collections (including subcollections)
-- The 'user_id' column on each collection is sufficient for RLS, avoiding recursion.
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

-- Also update insert, update, and delete policies to be explicit:
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.collections;
CREATE POLICY "Users can insert their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);
