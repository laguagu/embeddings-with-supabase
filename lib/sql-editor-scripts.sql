-- Drop the existing function
DROP FUNCTION match_images (vector (1536), FLOAT, INT);
-- Luo funktio samankaltaisten kuvien hakemiseen
CREATE OR REPLACE FUNCTION match_images(query_embedding vector(1536), query_description text, match_threshold float, match_count int)
RETURNS TABLE (id bigint, name text, path text, description text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    images.id,
    images.name,
    images.path,
    images.description,
    (0.6 * (1 - (images.embedding <=> query_embedding)) + 
     0.4 * (word_similarity(images.description, query_description))) AS similarity
  FROM images
  WHERE (1 - (images.embedding <=> query_embedding)) > match_threshold
    OR word_similarity(images.description, query_description) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Helper function to calculate word similarity
CREATE OR REPLACE FUNCTION word_similarity(text1 text, text2 text) RETURNS float AS $$
DECLARE
  words1 text[];
  words2 text[];
  common_words int;
  total_words int;
BEGIN
  words1 := regexp_split_to_array(lower(text1), '\s+');
  words2 := regexp_split_to_array(lower(text2), '\s+');
  
  SELECT COUNT(*) INTO common_words
  FROM unnest(words1) w1
  WHERE w1 = ANY(words2);
  
  total_words := array_length(words1, 1) + array_length(words2, 1);
  
  RETURN CASE WHEN total_words > 0 THEN (2.0 * common_words / total_words) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

TRUNCATE TABLE images RESTART IDENTITY;