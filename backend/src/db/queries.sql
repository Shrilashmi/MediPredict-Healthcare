-- ============================================================================
-- MediPredict - Useful SQL Queries
-- ============================================================================
-- Copy and paste these into pgAdmin Query Tool or psql
-- ============================================================================

-- ─── DATABASE OVERVIEW ───────────────────────────────────────────────────────

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count rows in each table
SELECT 
  'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'doctor_profiles', COUNT(*) FROM doctor_profiles
UNION ALL
SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL
SELECT 'consultations', COUNT(*) FROM consultations;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;


-- ─── USERS ───────────────────────────────────────────────────────────────────

-- View all users
SELECT id, username, email, role, created_at 
FROM users
ORDER BY created_at DESC;

-- Count users by role
SELECT role, COUNT(*) AS count
FROM users
GROUP BY role;

-- Find user by username
SELECT * FROM users WHERE username = 'dr.sarah';


-- ─── DOCTORS ─────────────────────────────────────────────────────────────────

-- View all verified doctors
SELECT 
  u.username,
  dp.full_name,
  dp.specialization,
  dp.hospital,
  dp.city,
  dp.year_of_passing,
  dp.verified,
  u.created_at
FROM users u
INNER JOIN doctor_profiles dp ON u.id = dp.user_id
WHERE u.role = 'doctor' AND dp.verified = TRUE
ORDER BY dp.full_name;

-- Doctors by specialization
SELECT 
  dp.specialization,
  COUNT(*) AS doctor_count
FROM doctor_profiles dp
WHERE dp.verified = TRUE
GROUP BY dp.specialization
ORDER BY doctor_count DESC;

-- Doctors by city
SELECT 
  dp.city,
  COUNT(*) AS doctor_count,
  STRING_AGG(dp.full_name, ', ') AS doctors
FROM doctor_profiles dp
WHERE dp.verified = TRUE
GROUP BY dp.city
ORDER BY doctor_count DESC;


-- ─── ASSESSMENTS ─────────────────────────────────────────────────────────────

-- View all assessments
SELECT 
  a.id,
  u.username AS patient,
  a.age,
  a.gender,
  a.risk_level,
  a.risk_score,
  a.created_at
FROM assessments a
INNER JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- Assessments by risk level
SELECT 
  risk_level,
  COUNT(*) AS count,
  ROUND(AVG(risk_score), 2) AS avg_score
FROM assessments
GROUP BY risk_level
ORDER BY 
  CASE risk_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'low' THEN 4
  END;

-- High-risk patients
SELECT 
  u.username,
  a.risk_level,
  a.risk_score,
  a.warnings,
  a.created_at
FROM assessments a
INNER JOIN users u ON a.user_id = u.id
WHERE a.risk_level IN ('high', 'critical')
ORDER BY a.risk_score DESC, a.created_at DESC;

-- Patient health history (replace username)
SELECT 
  created_at AS date,
  risk_level,
  risk_score,
  bmi,
  blood_pressure_systolic || '/' || blood_pressure_diastolic AS blood_pressure,
  glucose_level,
  heart_rate,
  temperature,
  symptoms,
  recommendations
FROM assessments a
WHERE user_id = (SELECT id FROM users WHERE username = 'PATIENT_USERNAME_HERE')
ORDER BY created_at DESC;


-- ─── CONSULTATIONS ───────────────────────────────────────────────────────────

-- View all consultations
SELECT 
  c.id,
  p.username AS patient,
  d.username AS doctor,
  dp.full_name AS doctor_name,
  dp.specialization,
  c.status,
  c.read,
  c.created_at
FROM consultations c
INNER JOIN users p ON c.patient_id = p.id
INNER JOIN users d ON c.doctor_id = d.id
LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
ORDER BY c.created_at DESC;

-- Pending consultations for a doctor (replace username)
SELECT 
  c.id,
  p.username AS patient,
  c.message,
  c.created_at,
  c.read,
  a.risk_level
FROM consultations c
INNER JOIN users p ON c.patient_id = p.id
INNER JOIN users d ON c.doctor_id = d.id
LEFT JOIN assessments a ON c.assessment_id = a.id
WHERE d.username = 'dr.sarah' 
  AND c.status = 'pending'
ORDER BY c.created_at ASC;

-- Consultations by status
SELECT 
  status,
  COUNT(*) AS count
FROM consultations
GROUP BY status
ORDER BY count DESC;

-- Doctor workload statistics
SELECT 
  d.username,
  dp.full_name,
  dp.specialization,
  COUNT(c.id) AS total_consultations,
  COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending,
  COUNT(CASE WHEN c.status = 'accepted' THEN 1 END) AS accepted,
  COUNT(CASE WHEN c.status = 'completed' THEN 1 END) AS completed,
  COUNT(CASE WHEN c.read = FALSE THEN 1 END) AS unread
FROM users d
INNER JOIN doctor_profiles dp ON d.id = dp.user_id
LEFT JOIN consultations c ON d.id = c.doctor_id
WHERE d.role = 'doctor' AND dp.verified = TRUE
GROUP BY d.username, dp.full_name, dp.specialization
ORDER BY total_consultations DESC;


-- ─── COMBINED QUERIES ────────────────────────────────────────────────────────

-- Patient dashboard overview (replace username)
SELECT 
  u.username,
  u.email,
  u.created_at AS member_since,
  COUNT(DISTINCT a.id) AS total_assessments,
  COUNT(DISTINCT c.id) AS total_consultations,
  MAX(a.created_at) AS last_assessment
FROM users u
LEFT JOIN assessments a ON u.id = a.user_id
LEFT JOIN consultations c ON u.id = c.patient_id
WHERE u.username = 'PATIENT_USERNAME_HERE'
GROUP BY u.username, u.email, u.created_at;

-- Doctor dashboard overview (replace username)
SELECT 
  u.username,
  dp.full_name,
  dp.specialization,
  dp.hospital,
  COUNT(DISTINCT c.id) AS total_consultations,
  COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_consultations,
  COUNT(CASE WHEN c.read = FALSE THEN 1 END) AS unread_messages
FROM users u
INNER JOIN doctor_profiles dp ON u.id = dp.user_id
LEFT JOIN consultations c ON u.id = c.doctor_id
WHERE u.username = 'dr.sarah'
GROUP BY u.username, dp.full_name, dp.specialization, dp.hospital;

-- High-risk patients needing consultation
SELECT 
  u.username AS patient,
  a.risk_level,
  a.risk_score,
  a.warnings,
  a.created_at AS assessment_date,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Consultation Requested'
    ELSE 'No Consultation'
  END AS consultation_status,
  c.status AS consultation_state
FROM assessments a
INNER JOIN users u ON a.user_id = u.id
LEFT JOIN consultations c ON a.id = c.assessment_id
WHERE a.risk_level IN ('high', 'critical')
ORDER BY a.risk_score DESC, a.created_at DESC;


-- ─── DATA INTEGRITY CHECKS ───────────────────────────────────────────────────

-- Users without doctor profiles (should only be patients)
SELECT u.username, u.role
FROM users u
LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
WHERE u.role = 'doctor' AND dp.id IS NULL;

-- Orphaned doctor profiles (shouldn't exist)
SELECT dp.*
FROM doctor_profiles dp
LEFT JOIN users u ON dp.user_id = u.id
WHERE u.id IS NULL;

-- Orphaned consultations (shouldn't exist due to CASCADE)
SELECT c.*
FROM consultations c
LEFT JOIN users p ON c.patient_id = p.id
LEFT JOIN users d ON c.doctor_id = d.id
WHERE p.id IS NULL OR d.id IS NULL;


-- ─── TESTING QUERIES ─────────────────────────────────────────────────────────

-- Test: Insert a patient user
-- INSERT INTO users (username, password, role) 
-- VALUES ('test_patient', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoWb1S0C/ovu', 'patient')
-- RETURNING *;

-- Test: Insert an assessment (replace user_id)
-- INSERT INTO assessments (
--   user_id, age, gender, bmi, blood_pressure_systolic, blood_pressure_diastolic,
--   glucose_level, temperature, heart_rate, risk_score, risk_level, 
--   recommendations, warnings
-- ) VALUES (
--   'USER_ID_HERE', 35, 'male', 28.5, 140, 90, 
--   120, 98.6, 85, 45, 'moderate',
--   ARRAY['Exercise regularly', 'Monitor blood pressure'],
--   ARRAY['Elevated blood pressure detected']
-- ) RETURNING *;

-- Test: Create consultation (replace patient_id and doctor_id)
-- INSERT INTO consultations (patient_id, doctor_id, message)
-- VALUES (
--   'PATIENT_ID_HERE',
--   (SELECT id FROM users WHERE username = 'dr.sarah'),
--   'I need advice about my recent assessment results.'
-- ) RETURNING *;


-- ─── CLEANUP QUERIES (USE WITH CAUTION!) ─────────────────────────────────────

-- Delete all consultations
-- DELETE FROM consultations;

-- Delete all assessments
-- DELETE FROM assessments;

-- Delete all non-doctor users (keeps doctors)
-- DELETE FROM users WHERE role = 'patient';

-- Reset auto-increment sequences (if using SERIAL instead of UUID)
-- Not needed for UUID-based tables


-- ─── ADVANCED QUERIES ────────────────────────────────────────────────────────

-- Monthly assessment trend
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS assessment_count,
  ROUND(AVG(risk_score), 2) AS avg_risk_score
FROM assessments
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Most common symptoms
SELECT 
  UNNEST(symptoms) AS symptom,
  COUNT(*) AS frequency
FROM assessments
WHERE symptoms IS NOT NULL
GROUP BY symptom
ORDER BY frequency DESC
LIMIT 10;

-- Doctors with fastest response time
SELECT 
  d.username,
  dp.full_name,
  COUNT(c.id) AS completed_consultations,
  AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) AS avg_hours_to_complete
FROM consultations c
INNER JOIN users d ON c.doctor_id = d.id
INNER JOIN doctor_profiles dp ON d.id = dp.user_id
WHERE c.status = 'completed'
GROUP BY d.username, dp.full_name
HAVING COUNT(c.id) > 0
ORDER BY avg_hours_to_complete ASC;

-- ============================================================================
-- END OF QUERIES
-- ============================================================================
