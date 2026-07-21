-- Seed for first Admin User
-- Password is 'admin123'
INSERT INTO admins (username, email, password_hash, role) 
VALUES ('admin', 'admin@absher.local', '$2y$10$F4FZTXbGIkwGNHCCie11sOCmrMVNkXnepklv3MG2YM0vucFM9ruYm', 'super_admin');
