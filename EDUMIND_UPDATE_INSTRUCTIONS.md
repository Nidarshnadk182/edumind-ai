# EduMind AI — Product-Ready Update

This package removes the marketing landing screen and starts with role selection.

## Required Supabase SQL
Run these migrations in order if they are not already applied:
1. `supabase/migrations/0007_complete_school_workflow.sql`
2. `supabase/migrations/0008_product_hardening.sql`

## Supabase Authentication URL settings
Add the production URLs:
- `https://YOUR-VERCEL-DOMAIN/auth/callback`
- `https://YOUR-VERCEL-DOMAIN/reset-password`
- `https://YOUR-VERCEL-DOMAIN/onboarding`

## Password reset
The Forgot Password page uses Supabase Auth `resetPasswordForEmail()`.
The email link returns through `/auth/callback` and then opens `/reset-password`.

## Main flow
Role selection → Login/Sign up → Role-specific onboarding → Dashboard.

## Teacher
The teacher can:
- create multiple classes;
- enter marks using student register number;
- add subject/chapter material;
- save corrected-paper feedback against a student;
- create assignments;
- create/publish tests.

## No sample people
Student, teacher, parent and institution dashboards have been changed to use Supabase records instead of hard-coded sample names/counts.
