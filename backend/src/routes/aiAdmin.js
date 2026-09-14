import express from 'express'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const aiAdminRouter = express.Router()

// -----------------------------------------------------------------------------
// Paths
// -----------------------------------------------------------------------------

const AI_DIR = path.resolve(process.cwd(), '../ai_model')
const MODEL_DIR = path.join(AI_DIR, 'model')
const DATA_DIR = path.join(AI_DIR, 'data')

const DATASET_PATH = path.join(DATA_DIR, 'medquad_enhanced.csv')

const MODEL_FILES = [
    'vectorizer.joblib',
    'question_vectors.joblib',
    'qa_pairs.pkl',
]

// -----------------------------------------------------------------------------
// GET /api/admin/ai/status
// -----------------------------------------------------------------------------

aiAdminRouter.get(
    '/status',
    requireAuth,
    requireAdmin,
    async(_req, res) => {
        try {
            let aiOnline = false
            let pairsLoaded = 0

            // Check Python AI service
            try {
                const response = await fetch('http://localhost:8000/health')

                if (response.ok) {
                    const data = await response.json()

                    aiOnline = data.status === 'ok'
                    pairsLoaded = data.pairs_loaded || 0
                }
            } catch {
                aiOnline = false
            }

            // Check model files
            const modelFiles = MODEL_FILES.map(file => {
                const filePath = path.join(MODEL_DIR, file)

                if (!fs.existsSync(filePath)) {
                    return {
                        name: file,
                        exists: false,
                        size: 0,
                        modifiedAt: null,
                    }
                }

                const stats = fs.statSync(filePath)

                return {
                    name: file,
                    exists: true,
                    size: stats.size,
                    modifiedAt: stats.mtime.toISOString(),
                }
            })

            // Check dataset
            let dataset = {
                name: 'medquad_enhanced.csv',
                exists: false,
                size: 0,
                modifiedAt: null,
            }

            if (fs.existsSync(DATASET_PATH)) {
                const stats = fs.statSync(DATASET_PATH)

                dataset = {
                    name: 'medquad_enhanced.csv',
                    exists: true,
                    size: stats.size,
                    modifiedAt: stats.mtime.toISOString(),
                }
            }

            const allModelFilesExist = modelFiles.every(
                file => file.exists
            )

            return res.json({
                aiOnline,
                pairsLoaded,
                modelType: 'TF-IDF + Cosine Similarity',
                confidenceThreshold: 0.45,
                modelReady: allModelFilesExist,
                modelFiles,
                dataset,
            })
        } catch (err) {
            console.error('[admin ai status]', err)

            return res.status(500).json({
                error: 'Failed to get AI model status',
            })
        }
    }
)

// -----------------------------------------------------------------------------
// POST /api/admin/ai/test
// -----------------------------------------------------------------------------

aiAdminRouter.post(
    '/test',
    requireAuth,
    requireAdmin,
    async(req, res) => {
        try {
            const message = (req.body?.message || '').trim()

            if (!message) {
                return res.status(400).json({
                    error: 'message is required',
                })
            }

            const response = await fetch(
                'http://localhost:8000/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                return res.status(response.status).json(data)
            }

            return res.json(data)
        } catch (err) {
            console.error('[admin ai test]', err)

            return res.status(503).json({
                error: 'AI service is offline. Make sure python app.py is running on port 8000.',
            })
        }
    }
)

// -----------------------------------------------------------------------------
// POST /api/admin/ai/retrain
// -----------------------------------------------------------------------------

aiAdminRouter.post(
    '/retrain',
    requireAuth,
    requireAdmin,
    async(_req, res) => {
        try {
            const scriptPath = path.join(
                AI_DIR,
                'train_model.py'
            )

            const dataPath = path.join('data', 'medquad_enhanced.csv')

            if (!fs.existsSync(scriptPath)) {
                return res.status(404).json({
                    error: 'Training script not found.',
                })
            }

            if (!fs.existsSync(DATASET_PATH)) {
                return res.status(404).json({
                    error: 'Dataset medquad_enhanced.csv not found.',
                })
            }

            const isWindows = process.platform === 'win32'

            const pythonPath = isWindows ?
                path.join(
                    AI_DIR,
                    'venv',
                    'Scripts',
                    'python.exe'
                ) :
                path.join(
                    AI_DIR,
                    'venv',
                    'bin',
                    'python'
                )

            const pythonExecutable =
                fs.existsSync(pythonPath) ?
                pythonPath :
                'python'

            const child = spawn(
                pythonExecutable, [
                    'train_model.py',
                    '--data',
                    dataPath,
                    '--out',
                    'model',
                ], {
                    cwd: AI_DIR,
                    windowsHide: true,
                }
            )

            let output = ''
            let errorOutput = ''

            child.stdout.on('data', chunk => {
                output += chunk.toString()
            })

            child.stderr.on('data', chunk => {
                errorOutput += chunk.toString()
            })

            child.on('error', err => {
                console.error(
                    '[admin ai retrain process]',
                    err
                )
            })

            child.on('close', code => {
                if (code === 0) {
                    console.log(
                        '[admin ai retrain] completed successfully'
                    )

                    console.log(output)
                } else {
                    console.error(
                        '[admin ai retrain] failed'
                    )

                    console.error(errorOutput)
                }
            })

            return res.json({
                message: 'Model retraining started successfully.',
                status: 'started',
            })
        } catch (err) {
            console.error('[admin ai retrain]', err)

            return res.status(500).json({
                error: 'Failed to start model retraining.',
            })
        }
    }
)

// -----------------------------------------------------------------------------
// GET /api/admin/ai/dataset
// -----------------------------------------------------------------------------

aiAdminRouter.get(
    '/dataset',
    requireAuth,
    requireAdmin,
    async(_req, res) => {
        try {
            if (!fs.existsSync(DATASET_PATH)) {
                return res.status(404).json({
                    error: 'Dataset not found.',
                })
            }

            const stats = fs.statSync(DATASET_PATH)

            const content = fs.readFileSync(
                DATASET_PATH,
                'utf8'
            )

            const lines = content.split(/\r?\n/)

            const preview = lines
                .slice(0, 6)
                .filter(line => line.trim() !== '')

            return res.json({
                name: 'medquad_enhanced.csv',
                size: stats.size,
                modifiedAt: stats.mtime.toISOString(),
                preview,
            })
        } catch (err) {
            console.error(
                '[admin ai dataset]',
                err
            )

            return res.status(500).json({
                error: 'Failed to read dataset information.',
            })
        }
    }
)

