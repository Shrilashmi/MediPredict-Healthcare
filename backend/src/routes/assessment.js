import { Router } from 'express'
import { validate, buildAssessment } from '../services/assessmentEngine.js'

export const assessmentRouter = Router()

/**
 * POST /api/health-assessment
 * Body: { age, gender, height, weight, systolicBP, diastolicBP,
 *         fastingSugar, temperature, heartRate, symptoms? }
 * Returns: structured risk-assessment JSON (fully deterministic, no AI)
 */
assessmentRouter.post('/', (req, res) => {
  try {
    const input = req.body

    // 1. Validate
    const errors = validate(input)
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ validationErrors: errors })
    }

    // 2. Run deterministic engine
    const result = buildAssessment(input)

    return res.json(result)
  } catch (err) {
    console.error('[health-assessment]', err)
    return res.status(500).json({ error: 'Assessment engine error' })
  }
})
