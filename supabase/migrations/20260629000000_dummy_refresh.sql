-- Dummy migration to force PostgREST schema cache reload
CREATE TABLE IF NOT EXISTS _dummy_cache_refresh (id INT);
DROP TABLE _dummy_cache_refresh;
