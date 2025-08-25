-- Post and Comment Notification Triggers

-- Function to notify when a new post is created
CREATE OR REPLACE FUNCTION notify_post_created()
RETURNS TRIGGER AS $$
BEGIN
  -- to notify the admin
  INSERT INTO notifications (user_id, title, message, type, role)
  SELECT id, 'New Post Created', 'A new post "' || NEW.title || '" has been created.', 'info', 'admin' FROM auth.users WHERE role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- the trigger for post creation
CREATE TRIGGER post_created_notification_trigger
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_created();

-- Function to notify when a new comment is added
CREATE OR REPLACE FUNCTION notify_comment_added()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- to get the author of the post
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;

  -- to notify the post author
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, message, type, role)
    VALUES (
      post_author_id,
      'New Comment on Your Post',
      'Someone commented on your post: "' || (SELECT title FROM posts WHERE id = NEW.post_id) || '"',
      'info',
      'user'
    );
  END IF;

  -- to notify admin
  INSERT INTO notifications (user_id, title, message, type, role)
  SELECT id, 'New Comment', 'A new comment was added to the post: "' || (SELECT title FROM posts WHERE id = NEW.post_id) || '"', 'info', 'admin' FROM auth.users WHERE role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- the trigger for comment creation
CREATE TRIGGER comment_added_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_added();
