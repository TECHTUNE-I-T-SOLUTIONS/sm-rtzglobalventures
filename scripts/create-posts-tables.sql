
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, post_id, comment_id)
);

CREATE POLICY "Enable read access for all users" ON posts FOR
SELECT
  USING (TRUE);

CREATE POLICY "Enable insert for authenticated users only" ON posts FOR
INSERT
  TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Enable update for users based on user_id" ON posts FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON comments FOR
SELECT
  USING (TRUE);

CREATE POLICY "Enable insert for authenticated users only" ON comments FOR
INSERT
  TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Enable update for users based on user_id" ON comments FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for all users" ON reactions FOR
SELECT
  USING (TRUE);

CREATE POLICY "Enable insert for authenticated users only" ON reactions FOR
INSERT
  TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Enable update for users based on user_id" ON reactions FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON reactions FOR DELETE USING (auth.uid() = user_id);

INSERT INTO
  storage.buckets (id, name, public)
VALUES
  ('posts', 'posts', TRUE);

CREATE POLICY "Enable read access for all users" ON storage.objects FOR
SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "Enable insert for authenticated users only" ON storage.objects FOR
INSERT
  TO authenticated WITH CHECK (bucket_id = 'posts');
