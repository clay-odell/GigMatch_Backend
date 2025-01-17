-- Connect to postgres database
\connect postgres;

-- Drop the existing databases
DROP DATABASE IF EXISTS gigmatch_db;
DROP DATABASE IF EXISTS gigmatch_test;

-- Create the new databases
CREATE DATABASE gigmatch_db;
CREATE DATABASE gigmatch_test;

-- Connect to the gigmatch_db database
\connect gigmatch_db;

-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing user_type_enum type and create updated user_type_enum type
DO $$
BEGIN
   DROP TYPE IF EXISTS user_type_enum CASCADE;
   CREATE TYPE user_type_enum AS ENUM ('Artist', 'Admin');
EXCEPTION
   WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
   CREATE TYPE status_enum AS ENUM ('Pending', 'Approved', 'Rejected');
EXCEPTION
   WHEN duplicate_object THEN null;
END $$;

-- Create Users Table in gigmatch_db
DROP TABLE IF EXISTS Users CASCADE;
CREATE TABLE Users (
  userId UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  userType user_type_enum NOT NULL,
  artistname VARCHAR(255), 
  venueName VARCHAR(255),
  location VARCHAR(255)
);

-- Insert a sample user into Users table
INSERT INTO Users (userId, name, email, password, userType, artistname, venueName, location)
VALUES 
(uuid_generate_v4(), 'Test User', 'test@example.com', 'password', 'Artist', 'The Test Group', NULL, NULL);

-- Create Calendar Event Requests Table in gigmatch_db
DROP TABLE IF EXISTS CalendarEventRequests CASCADE;
CREATE TABLE CalendarEventRequests (
  requestId UUID PRIMARY KEY,
  eventId UUID NOT NULL,
  userId UUID NOT NULL,
  artistName VARCHAR(255) NOT NULL,
  eventName VARCHAR(255) NOT NULL,
  status status_enum DEFAULT 'Pending' NOT NULL,
  requestDate DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  amount INTEGER,
  FOREIGN KEY (userId) REFERENCES Users(userId)
);

-- Insert sample event requests into CalendarEventRequests table
INSERT INTO CalendarEventRequests (requestId, eventId, userId, artistName, eventName, status, requestDate, startTime, endTime, amount)
VALUES 
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 1', 'Event 1', 'Approved', '2025-01-05 10:00:00', '10:00:00', '12:00:00', 100),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 2', 'Event 2', 'Approved', '2025-01-15 14:00:00', '14:00:00', '16:00:00', 150),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 3', 'Event 3', 'Approved', '2025-01-25 09:00:00', '09:00:00', '11:00:00', 120),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 4', 'Event 4', 'Approved', '2025-02-07 13:00:00', '13:00:00', '15:00:00', 200),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 5', 'Event 5', 'Approved', '2025-02-14 10:00:00', '10:00:00', '12:00:00', 180),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 6', 'Event 6', 'Approved', '2025-02-21 11:00:00', '11:00:00', '13:00:00', 160),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 7', 'Event 7', 'Approved', '2025-03-03 12:00:00', '12:00:00', '14:00:00', 170),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 8', 'Event 8', 'Approved', '2025-03-10 09:00:00', '09:00:00', '11:00:00', 150),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT userId FROM Users WHERE email = 'test@example.com'), 'Artist 9', 'Event 9', 'Approved', '2025-03-20 15:00:00', '15:00:00', '17:00:00', 200);
