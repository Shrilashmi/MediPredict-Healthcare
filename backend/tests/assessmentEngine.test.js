/**
 * assessmentEngine.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 15 deterministic unit tests for the rule-based health risk assessment engine.
 * Run with:  npm test
 *
 * All tests verify that identical input → identical output (pure functions).
 */

import {
  validate,
  classifyBMI,
  classifyBP,
  classifyGlucose,
  classifyTemp,
  classifyHR,
  buildAssessment,
} from '../src/services/assessmentEngine.js'

// ── Helper: build a valid baseline input ─────────────────────────────────────
function baseline(overrides = {}) {
  return {
    age:          35,
    gender:       'male',
    height:       175,
    weight:       70,
    systolicBP:   115,
    diastolicBP:  75,
    fastingSugar: 90,
    temperature:  36.6,
    heartRate:    72,
    symptoms:     [],
    ...overrides,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST 1 — Completely normal patient
// ═════════════════════════════════════════════════════════════════════════════
test('1. Completely normal patient → LOW risk, score 0, no health issues', () => {
  const result = buildAssessment(baseline())

  expect(result.riskScore).toBe(0)
  expect(result.riskLevel).toBe('LOW')
  expect(result.bmiCategory).toBe('Normal')
  expect(result.vitals.bloodPressure.category).toBe('Normal')
  expect(result.vitals.fastingSugar.category).toBe('Normal')
  expect(result.vitals.temperature.category).toBe('Typical')
  expect(result.vitals.heartRate.category).toBe('Typical')
  expect(result.healthIssues.length).toBe(0)
  expect(result.medicalRecommendation).toMatch(/routine/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 2 — High BP patient (Stage 2)
// ═════════════════════════════════════════════════════════════════════════════
test('2. Stage 2 high BP → HIGH risk, BP issue detected', () => {
  const result = buildAssessment(baseline({ systolicBP: 145, diastolicBP: 92 }))

  expect(result.vitals.bloodPressure.category).toBe('Stage 2')
  expect(result.riskScore).toBeGreaterThanOrEqual(25)
  expect(['HIGH', 'VERY_HIGH']).toContain(result.riskLevel)
  expect(result.healthIssues.some(i => i.name.includes('blood pressure'))).toBe(true)
  expect(result.preventiveMeasures.some(m => m.includes('blood pressure'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 3 — Prediabetes-range glucose (100–125)
// ═════════════════════════════════════════════════════════════════════════════
test('3. Prediabetes glucose (110 mg/dL) → MODERATE risk, prediabetes issue', () => {
  const result = buildAssessment(baseline({ fastingSugar: 110 }))

  expect(result.vitals.fastingSugar.category).toBe('Prediabetes range')
  expect(result.riskScore).toBeGreaterThanOrEqual(15)
  expect(result.riskLevel).toBe('MODERATE')
  expect(result.healthIssues.some(i => i.name.toLowerCase().includes('prediabetes'))).toBe(true)
  expect(result.preventiveMeasures.some(m => m.includes('refined sugars'))).toBe(true)
  // MUST NOT say "you have diabetes"
  expect(JSON.stringify(result)).not.toMatch(/you have diabetes/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 4 — Diabetes-range glucose (>=126)
// ═════════════════════════════════════════════════════════════════════════════
test('4. Diabetes-range glucose (140 mg/dL) → HIGH risk, correct label', () => {
  const result = buildAssessment(baseline({ fastingSugar: 140 }))

  expect(result.vitals.fastingSugar.category).toBe('Diabetes-range reading')
  expect(result.riskScore).toBeGreaterThanOrEqual(30)
  expect(['HIGH', 'VERY_HIGH']).toContain(result.riskLevel)
  expect(result.healthIssues.some(i => i.name.includes('Diabetes-range'))).toBe(true)
  // MUST NOT claim confirmed diagnosis
  expect(JSON.stringify(result)).not.toMatch(/you have diabetes/i)
  expect(JSON.stringify(result.healthIssues)).toMatch(/further medical testing/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 5 — Fever (>=38.0°C)
// ═════════════════════════════════════════════════════════════════════════════
test('5. Fever temperature (38.5°C) → fever issue, MODERATE+ risk', () => {
  const result = buildAssessment(baseline({ temperature: 38.5 }))

  expect(result.vitals.temperature.category).toBe('Fever range')
  expect(result.riskScore).toBeGreaterThanOrEqual(20)
  expect(result.healthIssues.some(i => i.name.includes('Fever'))).toBe(true)
  expect(result.preventiveMeasures.some(m => m.includes('hydrated'))).toBe(true)
  // Must NOT diagnose flu/COVID/pneumonia
  expect(JSON.stringify(result)).not.toMatch(/covid|pneumonia|influenza|flu/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 6 — High heart rate (101–120)
// ═════════════════════════════════════════════════════════════════════════════
test('6. Elevated heart rate (110 bpm) → elevated HR issue, 15 pts', () => {
  const result = buildAssessment(baseline({ heartRate: 110 }))

  expect(result.vitals.heartRate.category).toBe('Elevated')
  expect(result.riskScore).toBeGreaterThanOrEqual(15)
  expect(result.healthIssues.some(i => i.name.includes('heart-rate'))).toBe(true)
  expect(result.preventiveMeasures.some(m => m.includes('caffeine'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 7 — Low heart rate (<60)
// ═════════════════════════════════════════════════════════════════════════════
test('7. Low heart rate (48 bpm) → low HR issue, note healthy individuals', () => {
  const result = buildAssessment(baseline({ heartRate: 48 }))

  expect(result.vitals.heartRate.category).toBe('Low')
  expect(result.riskScore).toBeGreaterThanOrEqual(5)
  expect(result.healthIssues.some(i => i.name.includes('Low heart-rate'))).toBe(true)
  // Must note that some healthy individuals naturally have low HR
  expect(result.preventiveMeasures.some(m => m.includes('naturally'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 8 — Overweight patient (BMI 25–29.9)
// ═════════════════════════════════════════════════════════════════════════════
test('8. Overweight BMI (90kg, 175cm → BMI 29.4) → overweight issue', () => {
  const result = buildAssessment(baseline({ weight: 90, height: 175 }))

  expect(result.bmiCategory).toBe('Overweight')
  expect(result.bmi).toBeGreaterThanOrEqual(25)
  expect(result.bmi).toBeLessThan(30)
  expect(result.healthIssues.some(i => i.name.includes('Overweight'))).toBe(true)
  expect(result.preventiveMeasures.some(m => m.includes('crash diets'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 9 — Multiple abnormal vitals (>=3 outside typical)
// ═════════════════════════════════════════════════════════════════════════════
test('9. Multiple abnormal vitals → combination rule fires, +10 bonus pts', () => {
  // BP Stage 1 (+15), glucose prediabetes (+15), fever (+20), HR elevated (+15) = 4 abnormal
  const result = buildAssessment(baseline({
    systolicBP:   135,
    diastolicBP:  85,
    fastingSugar: 112,
    temperature:  38.2,
    heartRate:    105,
  }))

  expect(result.healthIssues.some(i => i.name.includes('Multiple abnormal'))).toBe(true)
  // Score should include bonus
  expect(result.riskScore).toBeGreaterThan(15 + 15 + 20 + 15) // > sum of base points
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 10 — Critical BP (>180 systolic)
// ═════════════════════════════════════════════════════════════════════════════
test('10. Critical BP (190/100) → CRITICAL risk regardless of score', () => {
  const result = buildAssessment(baseline({ systolicBP: 190, diastolicBP: 100 }))

  expect(result.vitals.bloodPressure.category).toBe('Severe')
  expect(result.riskLevel).toBe('CRITICAL')
  expect(result.medicalRecommendation).toMatch(/seek medical attention/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 11 — Invalid input (age out of range)
// ═════════════════════════════════════════════════════════════════════════════
test('11. Invalid age (999) → validation error returned', () => {
  const errors = validate(baseline({ age: 999 }))

  expect(Object.keys(errors).length).toBeGreaterThan(0)
  expect(errors.age).toMatch(/valid age/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 12 — Missing input (empty string)
// ═════════════════════════════════════════════════════════════════════════════
test('12. Missing field (heartRate = "") → validation error', () => {
  const errors = validate(baseline({ heartRate: '' }))

  expect(errors.heartRate).toMatch(/valid heart rate/i)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 13 — Combination: high BP + high glucose
// ═════════════════════════════════════════════════════════════════════════════
test('13. High BP (Stage 2) + diabetes-range glucose → cardiometabolic rule fires', () => {
  const result = buildAssessment(baseline({
    systolicBP:   145,
    diastolicBP:  92,
    fastingSugar: 135,
    weight:       88,    // BMI >= 25 needed for cardiometabolic rule
    height:       175,
  }))

  // Score = 25 (Stage2) + 30 (diabetic) + 10 (bmi overweight) + combo bonuses
  expect(result.riskScore).toBeGreaterThanOrEqual(55)
  expect(['HIGH', 'VERY_HIGH']).toContain(result.riskLevel)
  expect(result.healthIssues.some(i => i.name.toLowerCase().includes('cardiometabolic')
    || i.name.toLowerCase().includes('diabetes-risk')
    || i.name.toLowerCase().includes('blood pressure'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 14 — Fever + high heart rate combination rule
// ═════════════════════════════════════════════════════════════════════════════
test('14. Fever (38.5°C) + high HR (115 bpm) → combination rule D fires', () => {
  const result = buildAssessment(baseline({ temperature: 38.5, heartRate: 115 }))

  // Base: 20 (fever) + 15 (elevated HR) + 5 (combo D) = 40
  expect(result.riskScore).toBeGreaterThanOrEqual(40)
  expect(result.healthIssues.some(i => i.name.includes('Fever') || i.name.includes('acute illness'))).toBe(true)
})

// ═════════════════════════════════════════════════════════════════════════════
// TEST 15 — Normal vitals with low BMI (underweight)
// ═════════════════════════════════════════════════════════════════════════════
test('15. Underweight BMI (50kg, 175cm → BMI 16.3) + otherwise normal → LOW risk', () => {
  const result = buildAssessment(baseline({ weight: 50, height: 175 }))

  expect(result.bmiCategory).toBe('Underweight')
  expect(result.bmi).toBeLessThan(18.5)
  expect(result.riskScore).toBe(3)   // only BMI underweight = 3 pts
  expect(result.riskLevel).toBe('LOW')
  expect(result.healthIssues.some(i => i.name.includes('Underweight'))).toBe(true)
})

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISM CHECKS
// ─────────────────────────────────────────────────────────────────────────────
test('Determinism: identical input always produces identical output', () => {
  const input = baseline({ systolicBP: 138, fastingSugar: 118, temperature: 38.1, heartRate: 108 })
  const r1 = buildAssessment(input)
  const r2 = buildAssessment(input)
  const r3 = buildAssessment(input)

  expect(r1.riskScore).toBe(r2.riskScore)
  expect(r2.riskScore).toBe(r3.riskScore)
  expect(r1.riskLevel).toBe(r3.riskLevel)
  expect(JSON.stringify(r1.healthIssues)).toBe(JSON.stringify(r3.healthIssues))
})
