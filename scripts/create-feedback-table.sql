-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'product', 'service', 'website', 'support')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger function for feedback notifications
CREATE OR REPLACE FUNCTION handle_feedback_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for admins when new feedback is submitted
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Customer Feedback',
    CASE 
      WHEN NEW.category = 'general' THEN 'A customer submitted general feedback'
      WHEN NEW.category = 'product' THEN 'A customer submitted product feedback'
      WHEN NEW.category = 'service' THEN 'A customer submitted service feedback'
      WHEN NEW.category = 'website' THEN 'A customer submitted website feedback'
      WHEN NEW.category = 'support' THEN 'A customer submitted support feedback'
      ELSE 'A customer submitted feedback'
    END,
    'info'
  FROM profiles p
  WHERE p.role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback notifications
CREATE TRIGGER feedback_notification_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION handle_feedback_notification(); 