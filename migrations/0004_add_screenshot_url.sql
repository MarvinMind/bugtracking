-- Add screenshot column to issues table (stores base64 encoded image or URL)
ALTER TABLE issues ADD COLUMN screenshot TEXT;
