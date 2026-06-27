-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);
-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_study_materials_embedding ON study_materials USING hnsw (embedding vector_cosine_ops);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own study materials" ON study_materials;
CREATE POLICY "Users can manage own study materials" ON study_materials
  FOR ALL USING (auth.uid() = user_id);

DROP FUNCTION IF EXISTS match_study_materials;
DROP FUNCTION IF EXISTS match_study_materials(vector, float, int);
DROP FUNCTION IF EXISTS match_study_materials(vector, float, int, uuid);

CREATE OR REPLACE FUNCTION search_study_materials (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  filename text,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  select
    study_materials.id,
    study_materials.filename,
    study_materials.chunk_text,
    1 - (study_materials.embedding <=> query_embedding) as similarity
  from study_materials
  where user_id = p_user_id
    and 1 - (study_materials.embedding <=> query_embedding) > match_threshold
  order by study_materials.embedding <=> query_embedding
  limit match_count;
$$;
