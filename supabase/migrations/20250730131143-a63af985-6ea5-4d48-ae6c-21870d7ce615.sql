-- Add additional profile fields to the existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth DATE,
ADD COLUMN phone TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN location TEXT;