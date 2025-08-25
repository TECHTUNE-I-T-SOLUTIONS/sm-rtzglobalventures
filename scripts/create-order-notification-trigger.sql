-- Order and Stock Management Notification Triggers

-- Function to notify when order is created
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
BEGIN
  -- to notify the user
  INSERT INTO notifications (user_id, title, message, type, role)
  VALUES (
    NEW.user_id,
    'Order Placed Successfully',
    'Your order #' || NEW.id || ' has been placed successfully. Total: ₦' || NEW.total_amount || '. We will notify you when it ships.',
    'success',
    'user'
  );
  -- to notify the admin
  INSERT INTO notifications (user_id, title, message, type, role)
  SELECT id, 'New Order Received', 'A new order #' || NEW.id || ' has been placed.', 'info', 'admin' FROM auth.users WHERE role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- the trigger for order creation
CREATE TRIGGER order_created_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();

-- Function to notify when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- to notify the user
    INSERT INTO notifications (user_id, title, message, type, role)
    VALUES (
      NEW.user_id,
      'Order Status Updated',
      'Your order #' || NEW.id || ' status has been updated to: ' || NEW.status || '.',
      'info',
      'user'
    );
    -- to notify the admin
    INSERT INTO notifications (user_id, title, message, type, role)
    SELECT id, 'Order Status Updated', 'Order #' || NEW.id || ' status has been updated to: ' || NEW.status || '.', 'info', 'admin' FROM auth.users WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status changes
CREATE TRIGGER order_status_change_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Function to update product stock when order items are created
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- to update product stock quantity
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- to notify user about stock update
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    (SELECT user_id FROM orders WHERE id = NEW.order_id),
    'Stock Updated',
    'Product stock has been updated for your order.',
    'info'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- the trigger for order item creation (stock update)
CREATE TRIGGER order_item_stock_update_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_order();

-- Function to notify when payment status changes
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status != NEW.payment_status THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Payment Status Updated',
      'Payment for order #' || NEW.id || ' is now: ' || NEW.payment_status || '.',
      CASE 
        WHEN NEW.payment_status = 'paid' THEN 'success'
        WHEN NEW.payment_status = 'failed' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment status changes
CREATE TRIGGER payment_status_change_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_status_change();

-- Function to notify when transaction is created
CREATE OR REPLACE FUNCTION notify_transaction_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Transaction Created',
    'A new transaction has been created for ₦' || NEW.amount || '. Status: ' || NEW.status || '.',
    CASE 
      WHEN NEW.status = 'success' THEN 'success'
      WHEN NEW.status = 'failed' THEN 'error'
      ELSE 'info'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction creation
CREATE TRIGGER transaction_created_notification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_transaction_created();

-- Function to notify when transaction status changes
CREATE OR REPLACE FUNCTION notify_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Transaction Status Updated',
      'Your transaction status has been updated to: ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'success' THEN 'success'
        WHEN NEW.status = 'failed' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction status changes
CREATE TRIGGER transaction_status_change_notification_trigger
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_transaction_status_change();