/**
 * predictionEngine.js
 * Rule-based clinical screening engine.
 * Calculates BMI and screens for:
 *   Fever, Common Cold, Asthma, Diabetes, Hypertension, Cardiac red flags
 */

// ── Risk level helpers ────────────────────────────────────────────────────────
const RISK = { LOW: 'low', MODERATE: 'moderate', HIGH: 'high' }
const TRIAGE = { ROUTINE: 'routine', WATCH: 'watch', URGENT: 'urgent' }

function calcBMI(weight, height) {
  if (!weight || !height) return null
  return +(weight / Math.pow(height / 100, 2)).toFixed(1)
}

function bmiCategory(bmi) {
  if (!bmi) return 'Unknown'
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25)   return 'Normal'
  if (bmi < 30)   return 'Overweight'
  return 'Obese'
}

function hasSymptom(symptoms = [], ...targets) {
  const lower = symptoms.map(s => s.toLowerCase())
  return targets.some(t => lower.some(s => s.includes(t.toLowerCase())))
}

// ── Individual condition screeners ────────────────────────────────────────────

function screenFever({ temperature, symptoms }) {
  const hasFever   = temperature >= 37.8
  const hasChills  = hasSymptom(symptoms, 'fever', 'chills')
  const hasFatigue = hasSymptom(symptoms, 'fatigue')

  if (!hasFever && !hasChills) return null

  let score = 0
  let reasons = []

  if (temperature >= 39.5) { score += 40; reasons.push(`Very high temperature (${temperature}°C)`) }
  else if (temperature >= 38.5) { score += 25; reasons.push(`High temperature (${temperature}°C)`) }
  else if (temperature >= 37.8) { score += 12; reasons.push(`Elevated temperature (${temperature}°C)`) }
  if (hasChills)  { score += 10; reasons.push('Reported fever / chills') }
  if (hasFatigue) { score += 10; reasons.push('Fatigue present') }

  const level  = score >= 45 ? RISK.HIGH : score >= 20 ? RISK.MODERATE : RISK.LOW
  const triage = temperature >= 39.5 ? TRIAGE.URGENT : temperature >= 38.5 ? TRIAGE.WATCH : TRIAGE.ROUTINE

  return {
    condition: 'Fever',
    risk: level,
    score,
    reasoning: reasons.join('; '),
    preventiveMeasures: [
      'Rest and maintain adequate fluid intake.',
      'Monitor temperature every 4 hours.',
      'Use paracetamol / ibuprofen to manage fever (follow dosing instructions).',
      'Seek medical attention if fever exceeds 39.5°C or persists beyond 3 days.',
    ],
    specialization: 'General Practitioner',
    triage,
  }
}

function screenCommonCold({ temperature, symptoms }) {
  const coldSymptoms = ['cough', 'cold', 'runny nose', 'sore throat', 'nasal congestion', 'sneezing']
  const count = coldSymptoms.filter(s => hasSymptom(symptoms, s)).length
  if (count === 0) return null

  let score = count * 12
  if (temperature >= 37.5 && temperature < 38.5) score += 10
  const level  = score >= 50 ? RISK.HIGH : score >= 25 ? RISK.MODERATE : RISK.LOW
  const triage = score >= 50 ? TRIAGE.WATCH : TRIAGE.ROUTINE

  return {
    condition: 'Common Cold / URI',
    risk: level,
    score,
    reasoning: `${count} cold symptom(s) detected: ${coldSymptoms.filter(s => hasSymptom(symptoms, s)).join(', ')}.`,
    preventiveMeasures: [
      'Rest and increase fluid intake.',
      'Use saline nasal rinses for congestion.',
      'Honey and warm water can soothe a sore throat.',
      'Avoid close contact with others to prevent spread.',
      'Consult a doctor if symptoms worsen after 5 days.',
    ],
    specialization: 'General Practitioner',
    triage,
  }
}

function screenAsthma({ symptoms, heartRate }) {
  const asthmaSymptoms = ['shortness of breath', 'wheezing', 'chest tightness', 'difficulty breathing']
  const count = asthmaSymptoms.filter(s => hasSymptom(symptoms, s)).length
  if (count === 0) return null

  let score = count * 20
  if (heartRate > 100) score += 15
  const level  = score >= 55 ? RISK.HIGH : score >= 30 ? RISK.MODERATE : RISK.LOW
  const triage = score >= 55 ? TRIAGE.URGENT : TRIAGE.WATCH

  return {
    condition: 'Asthma / Respiratory',
    risk: level,
    score,
    reasoning: `Respiratory symptoms detected: ${asthmaSymptoms.filter(s => hasSymptom(symptoms, s)).join(', ')}${heartRate > 100 ? '; elevated heart rate (' + heartRate + ' bpm)' : ''}.`,
    preventiveMeasures: [
      'Use prescribed rescue inhaler if available.',
      'Identify and avoid personal triggers (dust, smoke, allergens).',
      'Pursue spirometry testing to confirm asthma diagnosis.',
      'Maintain a clean, dust-free sleeping environment.',
      'Seek emergency care if breathing worsens significantly.',
    ],
    specialization: 'Pulmonologist',
    triage,
  }
}

function screenDiabetes({ fastingSugar, symptoms, bmi }) {
  if (!fastingSugar) return null
  const diabeticSymptoms = ['thirst', 'frequent urination', 'fatigue', 'blurred vision', 'weight loss']
  const symCount = diabeticSymptoms.filter(s => hasSymptom(symptoms, s)).length

  let score    = 0
  let reasons  = []

  if (fastingSugar >= 126) { score += 50; reasons.push(`Fasting glucose ${fastingSugar} mg/dL (diabetic range ≥126)`) }
  else if (fastingSugar >= 100) { score += 25; reasons.push(`Fasting glucose ${fastingSugar} mg/dL (pre-diabetic range 100–125)`) }
  else { return null }

  if (symCount > 0) { score += symCount * 10; reasons.push(`${symCount} diabetic symptom(s)`) }
  if (bmi && bmi >= 25) { score += 10; reasons.push(`BMI ${bmi} (${bmiCategory(bmi)})`) }

  const level  = score >= 55 ? RISK.HIGH : score >= 30 ? RISK.MODERATE : RISK.LOW
  const triage = fastingSugar >= 200 ? TRIAGE.URGENT : score >= 55 ? TRIAGE.WATCH : TRIAGE.ROUTINE

  return {
    condition: 'Diabetes Mellitus',
    risk: level,
    score,
    reasoning: reasons.join('; '),
    preventiveMeasures: [
      'Schedule HbA1c and oral glucose tolerance test with your doctor.',
      'Reduce refined carbohydrates and sugary drinks.',
      'Exercise at least 30 minutes daily (moderate intensity).',
      'Monitor fasting blood glucose regularly.',
      'Maintain a healthy weight (target BMI 18.5–24.9).',
    ],
    specialization: 'Endocrinologist',
    triage,
  }
}

function screenHypertension({ systolicBP, diastolicBP, symptoms, bmi, age }) {
  if (!systolicBP || !diastolicBP) return null

  const hypertensive  = systolicBP >= 130 || diastolicBP >= 80
  const severe        = systolicBP >= 160 || diastolicBP >= 100
  const crisis        = systolicBP >= 180 || diastolicBP >= 120
  if (!hypertensive) return null

  let score   = 0
  let reasons = []

  if (crisis)       { score += 60; reasons.push(`Hypertensive crisis (${systolicBP}/${diastolicBP} mmHg)`) }
  else if (severe)  { score += 40; reasons.push(`Stage 2 hypertension (${systolicBP}/${diastolicBP} mmHg)`) }
  else              { score += 20; reasons.push(`Stage 1 hypertension (${systolicBP}/${diastolicBP} mmHg)`) }

  if (hasSymptom(symptoms, 'headache'))    { score += 10; reasons.push('Headache') }
  if (hasSymptom(symptoms, 'dizziness'))   { score += 8;  reasons.push('Dizziness') }
  if (bmi && bmi >= 25)                    { score += 8;  reasons.push(`BMI ${bmi}`) }
  if (age > 55)                            { score += 8;  reasons.push(`Age ${age}`) }

  const level  = score >= 55 ? RISK.HIGH : score >= 30 ? RISK.MODERATE : RISK.LOW
  const triage = crisis ? TRIAGE.URGENT : severe ? TRIAGE.WATCH : TRIAGE.ROUTINE

  return {
    condition: 'Hypertension',
    risk: level,
    score,
    reasoning: reasons.join('; '),
    preventiveMeasures: [
      'Reduce sodium intake (< 2,300 mg/day).',
      'Follow the DASH diet (fruits, vegetables, low-fat dairy).',
      'Exercise at least 150 min/week (aerobic).',
      'Limit alcohol; quit smoking if applicable.',
      'Monitor BP daily and keep a log.',
      'Take prescribed antihypertensives as directed.',
    ],
    specialization: 'Cardiologist',
    triage,
  }
}

function screenCardiac({ systolicBP, heartRate, symptoms, age, gender }) {
  const dangerSymptoms = ['chest pain', 'chest tightness', 'shortness of breath', 'jaw pain', 'left arm pain', 'palpitations']
  const count = dangerSymptoms.filter(s => hasSymptom(symptoms, s)).length
  if (count === 0 && heartRate < 110 && systolicBP < 160) return null

  let score   = 0
  let reasons = []

  score += count * 20
  if (count > 0) reasons.push(`Cardiac symptom(s): ${dangerSymptoms.filter(s => hasSymptom(symptoms, s)).join(', ')}`)

  if (heartRate > 120)     { score += 20; reasons.push(`Tachycardia (${heartRate} bpm)`) }
  else if (heartRate > 100){ score += 10; reasons.push(`Elevated HR (${heartRate} bpm)`) }
  if (heartRate < 50)      { score += 15; reasons.push(`Bradycardia (${heartRate} bpm)`) }
  if (systolicBP >= 160)   { score += 15; reasons.push(`High BP (${systolicBP} mmHg systolic)`) }
  if (age > 60)             { score += 10; reasons.push(`Age ${age}`) }
  if (gender === 'Male' && age > 45) { score += 5; reasons.push('Male >45') }

  if (score === 0) return null

  const level  = score >= 55 ? RISK.HIGH : score >= 30 ? RISK.MODERATE : RISK.LOW
  const triage = score >= 55 ? TRIAGE.URGENT : TRIAGE.WATCH

  return {
    condition: 'Cardiac Risk Indicators',
    risk: level,
    score,
    reasoning: reasons.join('; '),
    preventiveMeasures: [
      'If experiencing acute chest pain, call emergency services immediately.',
      'Schedule an ECG and cardiac enzyme panel with a cardiologist.',
      'Follow a heart-healthy diet (low saturated fat, low sodium).',
      'Take prescribed cardiac medications without interruption.',
      'Avoid strenuous activity until cleared by a physician.',
    ],
    specialization: 'Cardiologist',
    triage,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Main export
// ═════════════════════════════════════════════════════════════════════════════
export function runPrediction(formData) {
  const {
    age, gender, height, weight,
    systolicBP, diastolicBP,
    fastingSugar, temperature, heartRate,
    symptoms = [],
  } = formData

  const bmi = calcBMI(weight, height)
  const ctx = { age: +age, gender, height: +height, weight: +weight,
                systolicBP: +systolicBP, diastolicBP: +diastolicBP,
                fastingSugar: +fastingSugar, temperature: +temperature,
                heartRate: +heartRate, symptoms, bmi }

  const results = [
    screenFever(ctx),
    screenCommonCold(ctx),
    screenAsthma(ctx),
    screenDiabetes(ctx),
    screenHypertension(ctx),
    screenCardiac(ctx),
  ].filter(Boolean)

  // Overall triage = most severe individual triage
  const triagePriority = { urgent: 3, watch: 2, routine: 1 }
  const overallTriage = results.reduce((acc, r) => {
    return (triagePriority[r.triage] || 0) > (triagePriority[acc] || 0) ? r.triage : acc
  }, TRIAGE.ROUTINE)

  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    results,
    overallTriage,
    screenedAt: new Date().toISOString(),
    vitals: ctx,
  }
}
