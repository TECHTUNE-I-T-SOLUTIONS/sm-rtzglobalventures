-- to create security_questions table
CREATE TABLE IF NOT EXISTS security_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_1 TEXT NOT NULL,
  answer_1 TEXT NOT NULL,
  question_2 TEXT NOT NULL,
  answer_2 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- to create index for better performance
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);

-- to enable Row Level Security
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;

-- to create RLS policies for security questions
CREATE POLICY "Users can view own security questions" ON security_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security questions" ON security_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own security questions" ON security_questions FOR UPDATE USING (auth.uid() = user_id);

-- to create trigger for updated_at
CREATE TRIGGER update_security_questions_updated_at BEFORE UPDATE ON security_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 