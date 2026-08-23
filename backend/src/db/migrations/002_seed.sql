-- ============================================================================
-- MediPredict Seed Data
-- ============================================================================
-- Seeds 4 verified doctor accounts with profiles.
-- Passwords are bcrypt-hashed (all use: doctor123)
-- Hash generated with: bcrypt.hash('doctor123', 12)
-- ============================================================================

-- Seed 4 doctor users
-- Password for all: doctor123
-- Bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu
INSERT INTO users (id, username, password, role, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'dr.sarah',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu', 'doctor', NOW()),
  ('d2000000-0000-0000-0000-000000000002', 'dr.james',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu', 'doctor', NOW()),
  ('d3000000-0000-0000-0000-000000000003', 'dr.priya',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu', 'doctor', NOW()),
  ('d4000000-0000-0000-0000-000000000004', 'dr.michael', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu', 'doctor', NOW())
ON CONFLICT (username) DO NOTHING;

-- Seed 4 doctor profiles (all verified)
INSERT INTO doctor_profiles (
  id, user_id, full_name, degree, university, year_of_passing,
  highest_degree, hospital, specialization, city, verified
) VALUES
  (
    'a1100000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'Dr. Sarah Al-Mansouri',
    'MBBS, MD (Cardiology)',
    'University of Toronto',
    2012,
    'MD – Cardiology',
    'King Fahad Medical City',
    'Cardiologist',
    'Riyadh',
    TRUE
  ),
  (
    'a2200000-0000-0000-0000-000000000002',
    'd2000000-0000-0000-0000-000000000002',
    'Dr. James Okafor',
    'MBBS, MRCP',
    'University of Edinburgh',
    2010,
    'MRCP – Internal Medicine',
    'Cleveland Clinic Abu Dhabi',
    'Internal Medicine',
    'Abu Dhabi',
    TRUE
  ),
  (
    'a3300000-0000-0000-0000-000000000003',
    'd3000000-0000-0000-0000-000000000003',
    'Dr. Priya Nair',
    'MBBS, MD (Endocrinology)',
    'AIIMS New Delhi',
    2015,
    'MD – Endocrinology',
    'Apollo Hospitals',
    'Endocrinologist',
    'Chennai',
    TRUE
  ),
  (
    'a4400000-0000-0000-0000-000000000004',
    'd4000000-0000-0000-0000-000000000004',
    'Dr. Michael Torres',
    'MD, PhD (Pulmonology)',
    'Johns Hopkins University',
    2009,
    'PhD – Pulmonology',
    'Mayo Clinic',
    'Pulmonologist',
    'Rochester',
    TRUE
  )
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Seed data inserted successfully! 4 doctors created with password: doctor123';
END $$;
