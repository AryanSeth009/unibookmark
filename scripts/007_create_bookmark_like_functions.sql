CREATE OR REPLACE FUNCTION public.get_bookmark_engagement(bookmark_id_param UUID, user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    likes_count BIGINT,
    is_liked BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(bl.id) AS likes_count,
        EXISTS (SELECT 1 FROM public.bookmark_likes WHERE bookmark_id = bookmark_id_param AND user_id = user_id_param) AS is_liked
    FROM
        public.bookmark_likes bl
    WHERE
        bl.bookmark_id = bookmark_id_param;
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.get_bookmark_engagement(UUID, UUID) TO authenticated;
