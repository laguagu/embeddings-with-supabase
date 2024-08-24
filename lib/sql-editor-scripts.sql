-- Drop the existing function
DROP FUNCTION match_images (vector (1536), FLOAT, INT);

-- funktio samankaltaisten kuvien hakemiseen
CREATE OR REPLACE FUNCTION match_images(query_embedding vector(1536), query_description text, match_threshold float, match_count int)
RETURNS TABLE (id bigint, name text, path text, description text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT  -- Tämä skripti sisältää funktioita, jotka auttavat hakemaan samankaltaisia kuvia tietokannasta.
  -- Se sisältää kaksi pääfunktiota:
  -- 1. match_images: Hakee kuvia, jotka ovat samankaltaisia annetun kuvan upotuksen ja kuvauksen perusteella.
  -- 2. word_similarity: Laskee kahden tekstijonon sanallisen samankaltaisuuden.
  
  -- Poistetaan olemassa oleva match_images-funktio, jos se on olemassa
  DROP FUNCTION IF EXISTS match_images (vector (1536), FLOAT, INT);
  
  -- funktio samankaltaisten kuvien hakemiseen
  CREATE OR REPLACE FUNCTION match_images(
    query_embedding vector(1536),  -- Annetun kuvan upotusvektori
    query_description text,        -- Annetun kuvan kuvaus
    match_threshold float,         -- Kynnysarvo samankaltaisuudelle
    match_count int                -- Palautettavien tulosten määrä
  )
  RETURNS TABLE (
    id bigint,                     -- Kuvan ID
    name text,                     -- Kuvan nimi
    path text,                     -- Kuvan polku
    description text,              -- Kuvan kuvaus
    similarity float               -- Samankaltaisuusaste
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN QUERY
    SELECT
      images.id,
      images.name,
      images.path,
      images.description,
      -- Lasketaan samankaltaisuus yhdistämällä kuvien upotusten ja kuvausten samankaltaisuus
      (0.6 * (1 - (images.embedding <=> query_embedding)) + 
       0.4 * (word_similarity(images.description, query_description))) AS similarity
    FROM images
    -- Suodatetaan kuvat, jotka ylittävät kynnysarvon joko upotuksen tai kuvauksen perusteella
    WHERE (1 - (images.embedding <=> query_embedding)) > match_threshold
      OR word_similarity(images.description, query_description) > match_threshold
    -- Järjestetään tulokset samankaltaisuuden mukaan laskevasti
    ORDER BY similarity DESC
    -- Palautetaan vain määritelty määrä tuloksia
    LIMIT match_count;
  END;
  $$;
  
  -- Apufunktio sanallisen samankaltaisuuden laskemiseen
  CREATE OR REPLACE FUNCTION word_similarity(text1 text, text2 text) RETURNS float AS $$
  DECLARE
    words1 text[];                 -- Ensimmäisen tekstijonon sanat
    words2 text[];                 -- Toisen tekstijonon sanat
    common_words int;              -- Yhteisten sanojen määrä
    total_words int;               -- Kokonaismäärä sanoja molemmissa tekstijonoissa
  BEGIN
    -- Jaetaan tekstijonot sanoiksi ja muunnetaan pieniksi kirjaimiksi
    words1 := regexp_split_to_array(lower(text1), '\s+');
    words2 := regexp_split_to_array(lower(text2), '\s+');
    
    -- Lasketaan yhteisten sanojen määrä
    SELECT COUNT(*) INTO common_words
    FROM unnest(words1) w1
    WHERE w1 = ANY(words2);
    
    -- Lasketaan sanojen kokonaismäärä molemmissa tekstijonoissa
    total_words := array_length(words1, 1) + array_length(words2, 1);
    
    -- Palautetaan samankaltaisuusaste, joka on yhteisten sanojen määrä suhteessa kokonaismäärään
    RETURN CASE WHEN total_words > 0 THEN (2.0 * common_words / total_words) ELSE 0 END;
  END;
  $$ LANGUAGE plpgsql;
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
--- Jos total_words on suurempi kuin 0, palautetaan (2.0 * common_words / total_words), joka on yhteisten sanojen määrä suhteessa sanojen kokonaismäärään.  Muussa tapauksessa palautetaan 0§