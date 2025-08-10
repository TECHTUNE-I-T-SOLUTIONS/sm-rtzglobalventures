CREATE TABLE acquired_ebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ebook_id UUID REFERENCES ebooks(id) ON DELETE CASCADE,
    acquired_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ebook_id)
);

ALTER TABLE acquired_ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their acquired ebooks." ON acquired_ebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their acquired ebooks." ON acquired_ebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
