/**
 * assessmentEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic, rule-based Health Risk Assessment Engine.
 * NO AI · NO LLM · NO external API calls.
 *
 * Same input → always same output (pure functions, no randomness).
 *
 * Thresholds and scoring live in THRESHOLDS / SCORING objects.
 * Modify those objects to tune the engine without touching logic.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// THRESHOLDS  — validation ranges
// ═══════════════════════════════════════════════════════════════════════════════
export const THRESHOLDS = {
  age:    { min: 1,   max: 120 },
  height: { min: 50,  max: 250 },
  weight: { min: 2,   max: 300 },
  sbp:    { min: 50,  max: 250 },
  dbp:    { min: 30,  max: 150 },
  sugar:  { min: 30,  max: 600 },
  temp:   { min: 30,  max: 45  },
  hr:     { min: 20,  max: 250 },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING  — point values per category
// ═══════════════════════════════════════════════════════════════════════════════
export const SCORING = {
  bp: {
    normal:       0,
    elevated:     5,
    stage1:      15,
    stage2:      25,
    severe:      50,
  },
  glucose: {
    normal:       0,
    prediabetes: 15,
    diabetic:    30,
  },
  temperature: {
    typical:      0,
    elevated:     5,
    fever:       20,
  },
  heartRate: {
    typical:      0,
    low:          5,
    elevated:    15,
    veryHigh:    25,
  },
  bmi: {
    normal:       0,
    underweight:  3,
    overweight:   5,
    obese:       10,
  },
  combinations: {
    metabolicRisk:        10,
    diabetesRiskPattern:   5,
    feverHighHR:           5,
    multipleAbnormal:     10,
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREVENTIVE RECOMMENDATIONS  — predefined text, never AI-generated
// ═══════════════════════════════════════════════════════════════════════════════
export const RECOMMENDATIONS = {
  elevatedBP:
    'Monitor your blood pressure regularly and reduce excess salt and highly processed foods. ' +
    'Maintain regular physical activity and consult a healthcare professional if elevated readings persist.',

  highBP:
    'Monitor your blood pressure regularly and reduce excess salt and highly processed foods. ' +
    'Maintain regular physical activity and consult a healthcare professional if elevated readings persist.',

  prediabetes:
    'Focus on a balanced diet with fewer refined sugars and highly processed foods, and maintain regular physical activity. ' +
    'Regular blood glucose monitoring and medical follow-up can help reduce future risk.',

  diabeticRange:
    'Maintain a balanced diet, stay physically active, and avoid excessive intake of sugary foods and drinks. ' +
    'A diabetes-range reading should be confirmed through appropriate medical testing with a healthcare professional.',

  fever:
    'Stay hydrated, get adequate rest, and monitor your temperature and symptoms. ' +
    'Seek medical attention if the fever persists, becomes severe, or is accompanied by concerning symptoms.',

  highHeartRate:
    'Rest, stay hydrated, and avoid excessive caffeine or strenuous activity until your resting heart rate returns toward your usual range. ' +
    'Seek medical evaluation if the elevated rate persists or occurs with chest pain, fainting, dizziness, or breathing difficulty.',

  lowHeartRate:
    'Some people naturally have a resting heart rate below 60 bpm, but persistent low heart rate should be evaluated if it causes symptoms. ' +
    'Seek medical advice if you experience dizziness, fainting, unusual weakness, or breathing difficulty.',

  overweight:
    'Focus on balanced nutrition, regular physical activity, adequate sleep, and gradual healthy weight management. ' +
    'Avoid crash diets and aim for sustainable lifestyle changes.',

  obese:
    'Focus on sustainable nutrition, regular physical activity, adequate sleep, and gradual weight management. ' +
    'Consider discussing a personalized weight-management plan with a healthcare professional.',

  respiratory:
    'Avoid known environmental triggers such as smoke and maintain good hydration and rest. ' +
    'If wheezing, shortness of breath, chest tightness, or persistent cough occurs, seek medical evaluation.',

  multipleAbnormal:
    'Several health measurements are outside the typical range, so regular monitoring and professional medical evaluation are recommended. ' +
    'Maintain hydration, balanced nutrition, adequate rest, and avoid self-medicating based only on this assessment.',

  cardiometabolic:
    'Multiple cardiometabolic risk factors are present. Focus on dietary changes, regular physical activity, and weight management, ' +
    'and consult a healthcare professional for a comprehensive evaluation.',

  urgentSymptoms:
    'The combination of symptoms you have reported may require prompt medical evaluation. ' +
    'Do not delay seeking professional care if symptoms are severe, sudden, or worsening.',
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
export function validate(input) {
  const errors = {}
  const t = THRESHOLDS

  const fieldSpecs = [
    { key: 'age',          label: 'age',                  min: t.age.min,    max: t.age.max    },
    { key: 'height',       label: 'height (cm)',           min: t.height.min, max: t.height.max },
    { key: 'weight',       label: 'weight (kg)',           min: t.weight.min, max: t.weight.max },
    { key: 'systolicBP',   label: 'systolic BP',           min: t.sbp.min,    max: t.sbp.max    },
    { key: 'diastolicBP',  label: 'diastolic BP',          min: t.dbp.min,    max: t.dbp.max    },
    { key: 'fastingSugar', label: 'fasting blood sugar',   min: t.sugar.min,  max: t.sugar.max  },
    { key: 'temperature',  label: 'body temperature',      min: t.temp.min,   max: t.temp.max   },
    { key: 'heartRate',    label: 'heart rate',            min: t.hr.min,     max: t.hr.max     },
  ]

  for (const f of fieldSpecs) {
    const raw = input[f.key]
    if (raw === '' || raw === undefined || raw === null) {
      errors[f.key] = `Please enter a valid ${f.label}.`
      continue
    }
    const val = Number(raw)
    if (isNaN(val)) {
      errors[f.key] = `Please enter a valid ${f.label}.`
      continue
    }
    if (val < f.min || val > f.max) {
      errors[f.key] = `Please enter a valid ${f.label}.`
    }
  }

  const validGenders = ['male', 'female', 'other', 'prefer not to say']
  if (!input.gender || !validGenders.includes(String(input.gender).toLowerCase())) {
    errors.gender = 'Please select a valid gender.'
  }

  return errors // empty object = all valid
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BMI CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function classifyBMI(weight, height) {
  const bmi = +(weight / Math.pow(height / 100, 2)).toFixed(1)
  let category, points

  if (bmi < 18.5)      { category = 'Underweight'; points = SCORING.bmi.underweight }
  else if (bmi < 25.0) { category = 'Normal';      points = SCORING.bmi.normal      }
  else if (bmi < 30.0) { category = 'Overweight';  points = SCORING.bmi.overweight  }
  else                 { category = 'Obese';        points = SCORING.bmi.obese       }

  return { bmi, category, points }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. BLOOD PRESSURE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function classifyBP(systolic, diastolic) {
  const sbp = Number(systolic)
  const dbp = Number(diastolic)
  let category, points, severe = false

  if (sbp > 180 || dbp > 120) {
    category = 'Severe';   points = SCORING.bp.severe;   severe = true
  } else if (sbp >= 140 || dbp >= 90) {
    category = 'Stage 2';  points = SCORING.bp.stage2
  } else if (sbp >= 130 || dbp >= 80) {
    category = 'Stage 1';  points = SCORING.bp.stage1
  } else if (sbp >= 120 && dbp < 80) {
    category = 'Elevated'; points = SCORING.bp.elevated
  } else {
    category = 'Normal';   points = SCORING.bp.normal
  }

  return { category, points, severe, value: `${sbp}/${dbp}` }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. FASTING BLOOD SUGAR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function classifyGlucose(sugar) {
  const s = Number(sugar)
  let category, points

  if (s >= 126) {
    category = 'Diabetes-range reading'; points = SCORING.glucose.diabetic
  } else if (s >= 100) {
    category = 'Prediabetes range';      points = SCORING.glucose.prediabetes
  } else {
    category = 'Normal';                 points = SCORING.glucose.normal
  }

  return { category, points, value: s }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BODY TEMPERATURE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function classifyTemp(temp) {
  const t = Number(temp)
  let category, points

  if (t >= 38.0)      { category = 'Fever range'; points = SCORING.temperature.fever    }
  else if (t >= 37.4) { category = 'Elevated';    points = SCORING.temperature.elevated }
  else                { category = 'Typical';      points = SCORING.temperature.typical  }

  return { category, points, value: t }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. HEART RATE CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function classifyHR(hr) {
  const h = Number(hr)
  let category, points

  if (h > 120)       { category = 'Very high'; points = SCORING.heartRate.veryHigh  }
  else if (h >= 101) { category = 'Elevated';  points = SCORING.heartRate.elevated  }
  else if (h < 60)   { category = 'Low';       points = SCORING.heartRate.low       }
  else               { category = 'Typical';   points = SCORING.heartRate.typical   }

  return { category, points, value: h }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. SYMPTOM-BASED CONCERNS
// ═══════════════════════════════════════════════════════════════════════════════
export function applySymptoms(symptoms = []) {
  const concerns = []
  const lower = symptoms.map(s => String(s).toLowerCase())
  const has = (...terms) => terms.some(t => lower.some(s => s.includes(t.toLowerCase())))

  // Chest pain + shortness of breath → urgent
  if (has('chest pain', 'chest tightness') && has('shortness of breath', 'difficulty breathing')) {
    concerns.push({
      name: 'Urgent symptom combination',
      severity: 'HIGH',
      reason: 'Chest pain combined with shortness of breath was reported.',
      recommendationKey: 'urgentSymptoms',
    })
  }

  // Dizziness + palpitations → cardiovascular concern
  if (has('dizziness') && has('palpitation', 'heart racing', 'irregular heartbeat')) {
    concerns.push({
      name: 'Potential cardiovascular concern',
      severity: 'MODERATE',
      reason: 'Dizziness combined with palpitations was reported.',
      recommendationKey: 'urgentSymptoms',
    })
  }

  // Wheezing + shortness of breath → respiratory concern
  if (has('wheezing') && has('shortness of breath', 'difficulty breathing')) {
    concerns.push({
      name: 'Respiratory health concern',
      severity: 'MODERATE',
      reason: 'Respiratory symptoms detected. Medical evaluation may be appropriate.',
      recommendationKey: 'respiratory',
    })
  }

  // Fever + cough → respiratory/acute illness
  if (has('fever') && has('cough')) {
    concerns.push({
      name: 'Respiratory/acute illness-like pattern',
      severity: 'MODERATE',
      reason: 'Fever combined with cough was reported.',
      recommendationKey: 'fever',
    })
  }

  // Fever + body pain → acute illness
  if (has('fever') && has('body pain', 'muscle pain', 'body ache', 'aches', 'pain')) {
    // Only add if not already added by fever+cough rule
    if (!concerns.some(c => c.name === 'Respiratory/acute illness-like pattern')) {
      concerns.push({
        name: 'Acute illness-like pattern',
        severity: 'MODERATE',
        reason: 'Fever combined with body pain was reported.',
        recommendationKey: 'fever',
      })
    }
  }

  return concerns
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. COMBINATION RULES  (multi-vital interactions)
// ═══════════════════════════════════════════════════════════════════════════════
export function applyCombinations({ bmiResult, bpResult, glucoseResult, tempResult, hrResult }) {
  const bonusPoints = []
  const concerns    = []

  // Count how many vital signs are outside typical range
  let abnormalCount = 0
  if (bpResult.category      !== 'Normal')   abnormalCount++
  if (glucoseResult.category !== 'Normal')   abnormalCount++
  if (tempResult.category    !== 'Typical')  abnormalCount++
  if (hrResult.category      !== 'Typical')  abnormalCount++
  if (bmiResult.category     !== 'Normal')   abnormalCount++

  // Rule A — Metabolic Risk
  const bpAbnormal = ['Stage 1', 'Stage 2', 'Severe', 'Elevated'].includes(bpResult.category)
  if (bmiResult.bmi >= 25 && glucoseResult.value >= 100 && bpAbnormal) {
    bonusPoints.push(SCORING.combinations.metabolicRisk)
    concerns.push({
      name: 'Cardiometabolic risk',
      severity: 'HIGH',
      reason: `BMI ${bmiResult.bmi} (${bmiResult.category}), fasting glucose ${glucoseResult.value} mg/dL, and blood pressure ${bpResult.value} mmHg are all elevated.`,
      recommendationKey: 'cardiometabolic',
    })
  } else if (bmiResult.bmi >= 25 && glucoseResult.value >= 100) {
    bonusPoints.push(SCORING.combinations.metabolicRisk)
    concerns.push({
      name: 'Cardiometabolic risk',
      severity: 'MODERATE',
      reason: `BMI ${bmiResult.bmi} (${bmiResult.category}) combined with fasting glucose of ${glucoseResult.value} mg/dL.`,
      recommendationKey: 'cardiometabolic',
    })
  }

  // Rule B — Diabetes Risk Pattern
  if (glucoseResult.value >= 126 && bmiResult.bmi >= 25) {
    bonusPoints.push(SCORING.combinations.diabetesRiskPattern)
    // Note: only add concern if cardiometabolic not already added
    if (!concerns.some(c => c.name === 'Cardiometabolic risk')) {
      concerns.push({
        name: 'Diabetes-risk pattern',
        severity: 'HIGH',
        reason: `Diabetes-range fasting glucose (${glucoseResult.value} mg/dL) combined with BMI ${bmiResult.bmi} (${bmiResult.category}).`,
        recommendationKey: 'diabeticRange',
      })
    }
  }

  // Rule D — Fever + Elevated Heart Rate
  if (tempResult.value >= 38.0 && hrResult.value > 100) {
    bonusPoints.push(SCORING.combinations.feverHighHR)
    concerns.push({
      name: 'Fever/acute illness-like pattern',
      severity: 'MODERATE',
      reason: `Temperature ${tempResult.value}°C with elevated heart rate ${hrResult.value} bpm.`,
      recommendationKey: 'fever',
    })
  }

  // Rule E — Multiple Abnormal Vitals
  if (abnormalCount >= 3) {
    bonusPoints.push(SCORING.combinations.multipleAbnormal)
    concerns.push({
      name: 'Multiple abnormal vital signs',
      severity: abnormalCount >= 4 ? 'HIGH' : 'MODERATE',
      reason: `${abnormalCount} vital signs are outside their typical range.`,
      recommendationKey: 'multipleAbnormal',
    })
  }

  return { bonusPoints, concerns }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. HEALTH ISSUE DETECTION  (individual vitals → named issues)
// ═══════════════════════════════════════════════════════════════════════════════
function buildVitalHealthIssues({ bmiResult, bpResult, glucoseResult, tempResult, hrResult }) {
  const issues = []

  // Blood pressure
  if (bpResult.category === 'Elevated') {
    issues.push({
      name: 'Elevated blood pressure risk',
      severity: 'LOW',
      reason: `Blood pressure reading is ${bpResult.value} mmHg (Elevated category).`,
      recommendationKey: 'elevatedBP',
    })
  } else if (bpResult.category === 'Stage 1') {
    issues.push({
      name: 'Elevated blood pressure risk',
      severity: 'MODERATE',
      reason: `Blood pressure reading is ${bpResult.value} mmHg (Stage 1 high blood pressure reading). This requires monitoring; a single reading does not confirm hypertension.`,
      recommendationKey: 'highBP',
    })
  } else if (bpResult.category === 'Stage 2') {
    issues.push({
      name: 'High blood pressure risk',
      severity: 'HIGH',
      reason: `Blood pressure reading is ${bpResult.value} mmHg (Stage 2 high blood pressure reading). Professional evaluation is recommended.`,
      recommendationKey: 'highBP',
    })
  } else if (bpResult.category === 'Severe') {
    issues.push({
      name: 'High blood pressure risk',
      severity: 'CRITICAL',
      reason: `Blood pressure reading is ${bpResult.value} mmHg — in the severe range. Seek medical attention promptly.`,
      recommendationKey: 'highBP',
    })
  }

  // Glucose
  if (glucoseResult.category === 'Prediabetes range') {
    issues.push({
      name: 'Prediabetes risk',
      severity: 'MODERATE',
      reason: `Fasting blood glucose is ${glucoseResult.value} mg/dL (prediabetes range: 100–125 mg/dL).`,
      recommendationKey: 'prediabetes',
    })
  } else if (glucoseResult.category === 'Diabetes-range reading') {
    issues.push({
      name: 'Diabetes-range blood glucose detected',
      severity: 'HIGH',
      reason: `Fasting blood glucose is ${glucoseResult.value} mg/dL. Diabetes-range blood glucose detected. Further medical testing may be required for confirmation.`,
      recommendationKey: 'diabeticRange',
    })
  }

  // Temperature
  if (tempResult.category === 'Elevated') {
    issues.push({
      name: 'Fever/acute illness-like pattern',
      severity: 'LOW',
      reason: `Body temperature is ${tempResult.value}°C (slightly elevated above typical range).`,
      recommendationKey: 'fever',
    })
  } else if (tempResult.category === 'Fever range') {
    issues.push({
      name: 'Fever/acute illness-like pattern',
      severity: 'MODERATE',
      reason: `Body temperature is ${tempResult.value}°C — in the fever range (≥38.0°C).`,
      recommendationKey: 'fever',
    })
  }

  // Heart rate
  if (hrResult.category === 'Low') {
    issues.push({
      name: 'Low heart-rate pattern',
      severity: 'LOW',
      reason: `Resting heart rate is ${hrResult.value} bpm. Note: some healthy individuals naturally have a lower resting heart rate.`,
      recommendationKey: 'lowHeartRate',
    })
  } else if (hrResult.category === 'Elevated') {
    issues.push({
      name: 'Elevated heart-rate pattern',
      severity: 'MODERATE',
      reason: `Resting heart rate is ${hrResult.value} bpm (elevated: 101–120 bpm).`,
      recommendationKey: 'highHeartRate',
    })
  } else if (hrResult.category === 'Very high') {
    issues.push({
      name: 'Elevated heart-rate pattern',
      severity: 'HIGH',
      reason: `Resting heart rate is ${hrResult.value} bpm (very high: >120 bpm).`,
      recommendationKey: 'highHeartRate',
    })
  }

  // BMI
  if (bmiResult.category === 'Underweight') {
    issues.push({
      name: 'Underweight-related health risk',
      severity: 'LOW',
      reason: `BMI is ${bmiResult.bmi} (Underweight: <18.5).`,
      recommendationKey: 'overweight',
    })
  } else if (bmiResult.category === 'Overweight') {
    issues.push({
      name: 'Overweight-related health risk',
      severity: 'LOW',
      reason: `BMI is ${bmiResult.bmi} (Overweight: 25.0–29.9).`,
      recommendationKey: 'overweight',
    })
  } else if (bmiResult.category === 'Obese') {
    issues.push({
      name: 'Obesity-related health risk',
      severity: 'MODERATE',
      reason: `BMI is ${bmiResult.bmi} (Obesity range: ≥30.0).`,
      recommendationKey: 'obese',
    })
  }

  return issues
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. RISK LEVEL FROM SCORE
// ═══════════════════════════════════════════════════════════════════════════════
function scoreToRiskLevel(score, severeBP) {
  if (severeBP)    return 'CRITICAL'
  if (score >= 70) return 'VERY_HIGH'
  if (score >= 40) return 'HIGH'
  if (score >= 20) return 'MODERATE'
  return 'LOW'
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. MAIN ENGINE — buildAssessment()
// ═══════════════════════════════════════════════════════════════════════════════
export function buildAssessment(input) {
  // 1. Classify each vital
  const bmiResult     = classifyBMI(Number(input.weight), Number(input.height))
  const bpResult      = classifyBP(input.systolicBP, input.diastolicBP)
  const glucoseResult = classifyGlucose(input.fastingSugar)
  const tempResult    = classifyTemp(input.temperature)
  const hrResult      = classifyHR(input.heartRate)

  // 2. Base score
  const baseScore =
    bpResult.points +
    glucoseResult.points +
    tempResult.points +
    hrResult.points +
    bmiResult.points

  // 3. Combination rules
  const { bonusPoints, concerns: combinationConcerns } = applyCombinations({
    bmiResult, bpResult, glucoseResult, tempResult, hrResult,
  })
  const bonusTotal = bonusPoints.reduce((a, b) => a + b, 0)

  // 4. Symptom concerns
  const symptomConcerns = applySymptoms(input.symptoms || [])

  // 5. Individual vital health issues
  const vitalIssues = buildVitalHealthIssues({ bmiResult, bpResult, glucoseResult, tempResult, hrResult })

  // 6. Merge all health issues (deduplicate by name)
  const allIssues = [...vitalIssues, ...combinationConcerns, ...symptomConcerns]
  const seen = new Set()
  const healthIssues = allIssues.filter(issue => {
    if (seen.has(issue.name)) return false
    seen.add(issue.name)
    return true
  })

  // 7. Final score (cap at 100)
  const rawScore = baseScore + bonusTotal
  const riskScore = Math.min(rawScore, 100)

  // 8. Risk level (Rule F: severe BP overrides to CRITICAL)
  const riskLevel = scoreToRiskLevel(riskScore, bpResult.severe)

  // 9. Preventive measures (deduplicated by key)
  const seenKeys = new Set()
  const preventiveMeasures = healthIssues
    .filter(issue => {
      if (!issue.recommendationKey || seenKeys.has(issue.recommendationKey)) return false
      seenKeys.add(issue.recommendationKey)
      return true
    })
    .map(issue => RECOMMENDATIONS[issue.recommendationKey])
    .filter(Boolean)

  // If no issues, give a positive message
  if (healthIssues.length === 0) {
    preventiveMeasures.push(
      'Your vital signs are within typical ranges. Continue maintaining a balanced diet, regular physical activity, adequate sleep, and routine medical check-ups.'
    )
  }

  // 10. Medical recommendation text
  let medicalRecommendation
  if (riskLevel === 'CRITICAL') {
    medicalRecommendation =
      'Seek medical attention promptly. One or more critical readings require professional evaluation.'
  } else if (riskLevel === 'VERY_HIGH' || riskLevel === 'HIGH') {
    medicalRecommendation =
      'Professional medical evaluation is recommended.'
  } else if (riskLevel === 'MODERATE') {
    medicalRecommendation =
      'Consider scheduling a check-up with a healthcare professional to review these findings.'
  } else {
    medicalRecommendation =
      'Maintain your healthy lifestyle and continue routine medical check-ups.'
  }

  // 11. Structured JSON response
  return {
    riskScore,
    riskLevel,   // LOW | MODERATE | HIGH | VERY_HIGH | CRITICAL
    bmi: bmiResult.bmi,
    bmiCategory: bmiResult.category,

    vitals: {
      bloodPressure: {
        value:    bpResult.value,
        category: bpResult.category,
      },
      fastingSugar: {
        value:    glucoseResult.value,
        category: glucoseResult.category,
      },
      temperature: {
        value:    tempResult.value,
        category: tempResult.category,
      },
      heartRate: {
        value:    hrResult.value,
        category: hrResult.category,
      },
    },

    healthIssues: healthIssues.map(({ recommendationKey: _rk, ...rest }) => rest),
    preventiveMeasures,
    medicalRecommendation,

    // Pass-through for history storage
    inputSnapshot: {
      age:          Number(input.age),
      gender:       input.gender,
      height:       Number(input.height),
      weight:       Number(input.weight),
      systolicBP:   Number(input.systolicBP),
      diastolicBP:  Number(input.diastolicBP),
      fastingSugar: Number(input.fastingSugar),
      temperature:  Number(input.temperature),
      heartRate:    Number(input.heartRate),
      symptoms:     input.symptoms || [],
    },
  }
}
