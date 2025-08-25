-- the table to store push subscribers
CREATE TABLE IF NOT EXISTS push_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription jsonb NOT NULL,
  endpoint text GENERATED ALWAYS AS (subscription->>'endpoint') STORED,
  created_at timestamptz DEFAULT now()
);

-- the table to store push messages (history/analytics)
CREATE TABLE IF NOT EXISTS push_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  payload jsonb,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);
