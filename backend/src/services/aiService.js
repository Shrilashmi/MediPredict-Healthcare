import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `
You are MediPredict's AI Health Assistant — a cautious, empathetic triage assistant.

Your role:
- Answer general health and medical questions clearly and concisely.
- Interpret symptom descriptions and suggest possible considerations — never a definitive diagnosis.
- Recommend when to seek professional care, especially for urgent or serious symptoms.
- Provide general wellness, nutrition, and lifestyle guidance.
- Explain medical terms in plain language.

Rules you MUST follow:
1. ALWAYS end every response with this exact disclaimer on its own line:
"⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider."
2. Never prescribe specific medications or dosages.
3. For symptoms suggesting emergency (chest pain, difficulty breathing, stroke signs, severe bleeding), immediately advise calling emergency services (112 or local equivalent).
4. Be compassionate, non-alarmist, and concise.
5. If a question is completely unrelated to health or medicine, politely redirect.
`;

const DISCLAIMER =
    '⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.';

// URL of the locally trained Python ML chatbot service.
const LOCAL_MODEL_URL =
    process.env.LOCAL_MODEL_URL || 'http://localhost:8000/predict';

const LOCAL_MODEL_MIN_CONFIDENCE = Number(
    process.env.LOCAL_MODEL_MIN_CONFIDENCE || 0.2
);

const LOCAL_MODEL_TIMEOUT_MS = 3000;

/**
 * Response priority:
 *   1. Emergency rule-based response
 *   2. Locally trained ML model
 *   3. Curated rule-based patterns
 *   4. OpenAI-compatible API, if configured
 *   5. Generic deterministic fallback
 */
export async function buildAIResponse(messages, context = '') {
    const apiKey =
        process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

    const userMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user');

    const lastUserMsg = userMessage ? userMessage.content : '';

    // ── Emergency rules MUST run before the ML model ────────────────────────
    const emergencyReply = matchEmergencyRule(lastUserMsg);

    if (emergencyReply) {
        return emergencyReply;
    }

    // ── Mode 1: locally trained ML model ────────────────────────────────────
    try {
        const localReply = await callLocalModel(lastUserMsg);

        if (localReply) {
            return withDisclaimer(localReply);
        }
    } catch (err) {
        console.warn(
            '[aiService] Local ML model unavailable, falling back:',
            err.message
        );
    }

    // ── Mode 2: curated rule-based patterns ─────────────────────────────────
    const matchedRule = matchRule(lastUserMsg);

    if (matchedRule) {
        return matchedRule;
    }

    // ── Mode 3: OpenAI-compatible call ──────────────────────────────────────
    if (apiKey && apiKey.trim().length > 10) {
        try {
            return await callOpenAI(messages, context, apiKey);
        } catch (err) {
            console.warn(
                '[aiService] OpenAI call failed, falling back to rules:',
                err.message
            );
        }
    }

    // ── Mode 4: generic fallback ────────────────────────────────────────────
    return ruleBasedResponse(messages, context);
}

// ── Local trained model call ─────────────────────────────────────────────────
async function callLocalModel(message) {
    if (!message) return null;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, LOCAL_MODEL_TIMEOUT_MS);

    try {
        const response = await fetch(LOCAL_MODEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!data.reply ||
            typeof data.confidence !== 'number'
        ) {
            return null;
        }

        if (data.confidence < LOCAL_MODEL_MIN_CONFIDENCE) {
            return null;
        }

        return data.reply;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

// ── Add disclaimer to ML responses ───────────────────────────────────────────
function withDisclaimer(text) {
    return text.includes('Disclaimer') ?
        text :
        `${text}\n\n${DISCLAIMER}`;
}

// ── OpenAI-compatible call ───────────────────────────────────────────────────
async function callOpenAI(messages, context, apiKey) {
    const systemContent = context ?
        `${SYSTEM_PROMPT}\n\nPatient screening context:\n${context}` :
        SYSTEM_PROMPT;

    const payload = {
        model: 'gpt-4o-mini',
        messages: [{
                role: 'system',
                content: systemContent,
            },
            ...messages,
        ],
        max_tokens: 600,
        temperature: 0.4,
    };

    const response = await fetch(
        'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        const err = await response.text();

        throw new Error(
            `OpenAI error ${response.status}: ${err}`
        );
    }

    const data = await response.json();

    return data.choices[0].message.content;
}

// ── Emergency rules ──────────────────────────────────────────────────────────
const EMERGENCY_RULES = [{
    keywords: [
        'chest pain',
        'severe chest pain',
        'pressure in chest',
        'pressure on chest',
        'tightness in chest',
        'chest tightness',
        'difficulty breathing',
        'trouble breathing',
        'trouble taking a breath',
        'hard to breathe',
        'hard time breathing',
        'cannot breathe',
        "can't breathe",
        'unable to breathe',
        'unable to breath',
        'shortness of breath',
        'severe shortness of breath',
        'stroke',
        'heart attack',
        'severe bleeding',
        'uncontrolled bleeding',
    ],

    response: `🚨 **Emergency Alert**

The symptoms you've described may indicate a life-threatening emergency.

Please call **112** (or your local emergency number) immediately or have someone take you to the nearest emergency room.

**Do not wait or attempt to manage these symptoms at home.**

${DISCLAIMER}`,
}, ];

// ── Match emergency rule ──────────────────────────────────────────────────────
function matchEmergencyRule(message) {
    const lower = (message || '').toLowerCase().trim();

    for (const rule of EMERGENCY_RULES) {
        if (
            rule.keywords.some((keyword) =>
                lower.includes(keyword)
            )
        ) {
            return rule.response;
        }
    }

    return null;
}

// ── Other health rules ────────────────────────────────────────────────────────
const HEALTH_RULES = [{
        keywords: [
            'fever',
            'temperature',
            'hot',
            'chills',
        ],

        response: `**Fever Guidance**

A fever (temperature above 38°C / 100.4°F) is usually your body's response to an infection.

**General recommendations:**
- Rest and stay hydrated with water or electrolyte drinks.
- Paracetamol (acetaminophen) or ibuprofen may help reduce fever — follow the package directions.
- Monitor your temperature regularly.

**Seek medical care if:**
- Temperature exceeds 39.5°C (103°F).
- Fever lasts more than 3 days.
- Fever is accompanied by severe headache, stiff neck, rash, or confusion.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'diabetes',
            'blood sugar',
            'glucose',
            'thirst',
            'frequent urination',
        ],

        response: `**Diabetes & Blood Sugar**

Elevated blood sugar can indicate pre-diabetes or diabetes. Common indicators include increased thirst, frequent urination, fatigue, and blurred vision.

**Lifestyle tips:**
- Reduce refined carbohydrates and sugary beverages.
- Aim for around 30 minutes of moderate exercise most days.
- Monitor fasting blood glucose regularly.
- Maintain a healthy weight.

**Consult a doctor** for proper HbA1c testing and personalised management.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'blood pressure',
            'hypertension',
            'bp',
            'systolic',
            'diastolic',
        ],

        response: `**Blood Pressure Guidance**

Normal blood pressure is generally below 120/80 mmHg. Hypertension is generally considered at or above 130/80 mmHg.

**Lifestyle measures:**
- Reduce sodium (salt) intake.
- Exercise regularly — aim for around 150 minutes per week.
- Limit alcohol and avoid smoking.
- Manage stress through relaxation techniques.
- Maintain a healthy weight (BMI 18.5–24.9).

**Seek medical care** if blood pressure is consistently above 140/90 or you experience concerning symptoms such as severe headache, dizziness, or vision changes.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'cough',
            'cold',
            'runny nose',
            'sore throat',
            'congestion',
        ],

        response: `**Common Cold / Cough**

Most common colds are caused by viruses and often improve within 7–10 days.

**Supportive care:**
- Rest and increase fluid intake.
- Honey and warm water can soothe a cough.
- Saline nasal rinses can help with congestion.
- Over-the-counter medicines may help with symptoms; follow package directions.

**See a doctor if:**
- Symptoms worsen after several days.
- You develop a high fever (>39°C), ear pain, or shortness of breath.
- Cough persists for more than 3 weeks.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'asthma',
            'wheez',
        ],

        response: `**Asthma / Breathing Difficulty**

Wheezing can be a sign of asthma or another respiratory condition.

**General guidance:**
- If you have a prescribed rescue inhaler, use it according to your doctor's instructions.
- Sit upright and try to remain calm.
- Avoid known triggers such as dust, smoke, cold air, or allergens.

**See a doctor promptly** if breathing difficulty does not improve with your prescribed treatment or if symptoms keep returning.

**Go to the ER** if your lips or fingertips turn blue, breathing becomes severe, or you cannot complete sentences.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'bmi',
            'weight',
            'obese',
            'overweight',
        ],

        response: `**BMI & Weight Management**

BMI (Body Mass Index) = weight (kg) ÷ height (m)²

| BMI Range | Category |
|---|---|
| < 18.5 | Underweight |
| 18.5–24.9 | Normal |
| 25–29.9 | Overweight |
| ≥30 | Obese |

**Tips for healthy weight:**
- Eat a balanced diet rich in vegetables, lean protein, and whole grains.
- Exercise regularly.
- Track your food intake if useful.
- Seek a dietitian for personalised guidance.

${DISCLAIMER}`,
    },

    {
        keywords: [
            'headache',
            'migraine',
            'head pain',
        ],

        response: `**Headache & Migraine**

Many headaches are tension-type headaches or migraines and are not dangerous, but symptoms should be considered in context.

**Self-care:**
- Rest in a quiet, dark room.
- Stay hydrated.
- Apply a cold or warm compress to your forehead.
- Over-the-counter pain relievers may help mild-to-moderate pain; follow package directions.

**Seek urgent care if:**
- You develop a sudden, severe "thunderclap" headache.
- Headache occurs with fever, stiff neck, or rash.
- Headache follows a head injury.
- Headache progressively worsens over several days.

${DISCLAIMER}`,
    },
];

// ── Match curated health rule ─────────────────────────────────────────────────
function matchRule(message) {
    const lower = (message || '').toLowerCase().trim();

    for (const rule of HEALTH_RULES) {
        if (
            rule.keywords.some((keyword) =>
                lower.includes(keyword)
            )
        ) {
            return rule.response;
        }
    }

    return null;
}

// ── Deterministic fallback ────────────────────────────────────────────────────
function ruleBasedResponse(messages, context) {
    const userMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user');

    const lastUserMsg = userMessage ?
        userMessage.content.toLowerCase() :
        '';

    const matchedEmergency = matchEmergencyRule(lastUserMsg);

    if (matchedEmergency) {
        return matchedEmergency;
    }

    const matched = matchRule(lastUserMsg);

    if (matched) {
        return matched;
    }

    return `Thank you for your question. As your AI health assistant, I'm here to provide general health information and guidance.

Based on your query, I recommend:

1. **Consult a healthcare professional** — for personalised medical advice based on your specific situation.
2. **Monitor your symptoms** — keep a log of when symptoms occur, their severity, and any potential triggers.
3. **Maintain healthy habits** — adequate sleep, balanced nutrition, regular exercise, and stress management are important for overall health.
4. **Use MediPredict's screening tool** — run a New Screening from your dashboard to get a risk assessment based on your current vitals and symptoms.

Is there a specific health concern I can help you with? Please describe your symptoms or question in more detail.

${DISCLAIMER}`;
}