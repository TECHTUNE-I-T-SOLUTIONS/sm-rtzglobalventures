-- Cart Item Notification Triggers
-- Function to notify when item is added to cart
CREATE OR REPLACE FUNCTION notify_cart_item_added()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Item Added to Cart',
    'You have successfully added an item to your cart. You can view your cart to complete your purchase.',
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- to trigger for cart item addition
CREATE TRIGGER cart_item_added_notification_trigger
  AFTER INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_cart_item_added();

-- I added a function to notify when item is removed from the cart
CREATE OR REPLACE FUNCTION notify_cart_item_removed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    OLD.user_id,
    'Item Removed from Cart',
    'An item has been removed from your cart.',
    'info'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cart item removal
CREATE TRIGGER cart_item_removed_notification_trigger
  AFTER DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_cart_item_removed();

-- Function to notify when cart item quantity is updated
CREATE OR REPLACE FUNCTION notify_cart_item_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.quantity != NEW.quantity THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Cart Updated',
      'Your cart has been updated. Quantity changed from ' || OLD.quantity || ' to ' || NEW.quantity || '.',
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cart item updates
CREATE TRIGGER cart_item_updated_notification_trigger
  AFTER UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_cart_item_updated(); 