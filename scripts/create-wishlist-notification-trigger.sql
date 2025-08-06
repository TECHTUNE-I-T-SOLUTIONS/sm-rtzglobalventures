-- Create trigger function for wishlist notifications
CREATE OR REPLACE FUNCTION notify_wishlist_added()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification when item is added to wishlist
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    NEW.user_id,
    'Item Added to Wishlist',
    'You have successfully added an item to your wishlist. You can view it in your profile.',
    'success'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wishlist_items table
CREATE TRIGGER wishlist_notification_trigger
  AFTER INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_wishlist_added();

-- Create trigger function for wishlist removal notifications
CREATE OR REPLACE FUNCTION notify_wishlist_removed()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification when item is removed from wishlist
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    OLD.user_id,
    'Item Removed from Wishlist',
    'An item has been removed from your wishlist.',
    'info'
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wishlist_items table for removal
CREATE TRIGGER wishlist_removal_notification_trigger
  AFTER DELETE ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_wishlist_removed(); 