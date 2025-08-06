-- Insert sample products
INSERT INTO products (name, description, price, category, subcategory, image_url, stock_quantity, is_featured, is_active) VALUES
-- Computer accessories
('USB-C Hub 7-in-1', 'Multi-port USB-C hub with HDMI, USB 3.0, and SD card slots', 15000.00, 'computers', 'hubs', '/placeholder.svg?height=300&width=300', 25, true, true),
('Wireless Mouse', 'Ergonomic wireless mouse with long battery life', 8500.00, 'computers', 'peripherals', '/placeholder.svg?height=300&width=300', 40, true, true),
('Laptop Charger 65W', 'Universal laptop charger compatible with most brands', 12000.00, 'computers', 'chargers', '/placeholder.svg?height=300&width=300', 30, true, true),
('HDMI Cable 2m', 'High-speed HDMI cable for 4K video transmission', 3500.00, 'computers', 'cables', '/placeholder.svg?height=300&width=300', 50, false, true),
('Bluetooth Keyboard', 'Compact wireless keyboard for tablets and phones', 18000.00, 'computers', 'peripherals', '/placeholder.svg?height=300&width=300', 20, true, true),
('Phone Charger Fast', 'Fast charging cable for Android and iPhone', 4500.00, 'computers', 'chargers', '/placeholder.svg?height=300&width=300', 60, false, true),
('External Hard Drive 1TB', 'Portable external storage for backup and file transfer', 35000.00, 'computers', 'storage', '/placeholder.svg?height=300&width=300', 15, true, true),
('Webcam HD 1080p', 'High-definition webcam for video calls and streaming', 22000.00, 'computers', 'peripherals', '/placeholder.svg?height=300&width=300', 18, false, true),

-- Books
('Introduction to Computer Science', 'Comprehensive guide to computer science fundamentals', 8500.00, 'books', 'textbooks', '/placeholder.svg?height=300&width=300', 25, true, true),
('Advanced Mathematics', 'Higher mathematics for engineering students', 12000.00, 'books', 'textbooks', '/placeholder.svg?height=300&width=300', 20, true, true),
('English Literature Classics', 'Collection of classic English literature works', 6500.00, 'books', 'literature', '/placeholder.svg?height=300&width=300', 30, false, true),
('Physics for Engineers', 'Applied physics concepts for engineering applications', 15000.00, 'books', 'textbooks', '/placeholder.svg?height=300&width=300', 18, true, true),
('Business Management', 'Principles and practices of modern business management', 9500.00, 'books', 'business', '/placeholder.svg?height=300&width=300', 22, false, true),
('Programming in Python', 'Learn Python programming from basics to advanced', 11000.00, 'books', 'programming', '/placeholder.svg?height=300&width=300', 28, true, true),
('Nigerian History', 'Comprehensive history of Nigeria from ancient times', 7500.00, 'books', 'history', '/placeholder.svg?height=300&width=300', 15, false, true),
('Research Methodology', 'Guide to conducting academic and scientific research', 13500.00, 'books', 'academic', '/placeholder.svg?height=300&width=300', 20, true, true);

-- Create admin user (you'll need to sign up first, then update the role)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@smartzglobal.com';
