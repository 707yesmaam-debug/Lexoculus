-- Manually add the missing 'tailored_questions' column to the 'risk_assessments' table
-- Run this in your Supabase SQL Editor

ALTER TABLE "risk_assessments" 
ADD COLUMN IF NOT EXISTS "tailored_questions" JSONB;
