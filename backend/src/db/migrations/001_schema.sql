-- ============================================================================
-- MediPredict Database Schema
-- ============================================================================
-- This migration creates all tables, indexes, triggers, and RLS policies.
-- Run with: npm run migrate
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Table: users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username     VARCHAR(60) NOT NULL UNIQUE,
  password     TEXT        NOT NULL,
  role         VARCHAR(10) NOT NULL CHECK (role IN ('patient','doctor')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ── Table: doctor_profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name         VARCHAR(120) NOT NULL,
  degree            VARCHAR(120) NOT NULL,
  university        VARCHAR(150) NOT NULL,
  year_of_passing   SMALLINT    NOT NULL CHECK (year_of_passing BETWEEN 1950 AND 2100),
  highest_degree    VARCHAR(150) NOT NULL,
  hospital          VARCHAR(150) NOT NULL,
  specialization    VARCHAR(100) NOT NULL,
  city              VARCHAR(80)  NOT NULL,
  verified          BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_spec ON doctor_profiles (specialization);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_city ON doctor_profiles (city);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verified ON doctor_profiles (verified);

-- ── Table: assessments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vitals          JSONB       NOT NULL DEFAULT '{}',
  symptoms        TEXT[]      NOT NULL DEFAULT '{}',
  prediction      JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_prediction ON assessments USING GIN (prediction);

-- ── Table: consultations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_name       VARCHAR(80) NOT NULL,
  doctor_user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_profile_id  UUID        NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  message            TEXT        NOT NULL,
  status             VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  read               BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations (patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_user_id ON consultations (doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations (status);
CREATE INDEX IF NOT EXISTS idx_consultations_unread ON consultations (doctor_user_id) WHERE read = FALSE;

-- ── Triggers: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_profiles_updated_at ON doctor_profiles;
CREATE TRIGGER trg_doctor_profiles_updated_at
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_consultations_updated_at ON consultations;
CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Success message ──────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE 'Schema created successfully!';
END $$;
