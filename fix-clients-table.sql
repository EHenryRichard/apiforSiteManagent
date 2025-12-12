-- Fix clients table to use string user_id instead of integer id
-- Run this SQL script in your MySQL database

-- Step 1: Drop the existing clients table (if you have no important data)
DROP TABLE IF EXISTS clients;

-- Step 2: Restart your Node.js server
-- The server will automatically recreate the table with the correct schema

-- Alternative: If you want to keep existing data, use this instead:
-- (Comment out the DROP TABLE above and uncomment the lines below)

/*
-- Backup existing data
CREATE TABLE clients_backup AS SELECT * FROM clients;

-- Drop old table
DROP TABLE clients;

-- Restart server to create new table structure

-- Restore data (you'll need to manually map the old integer user_id to string user_id)
-- This is complex and depends on your data
*/
