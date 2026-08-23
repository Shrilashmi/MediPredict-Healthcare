import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `You are MediPredict's AI Health Assistant — a cautious, empathetic triage assistant.

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
3. For symptoms suggesting emergency (chest pain, difficulty breathing, stroke signs, severe bleeding), immediately advise calling emergency services (911 or local equivalent).
4. Be compassionate, non-alarmist, and concise.
5. If a question is completely unrelated to health or medicine, politely redirect.`;

const DISCLAIMER = '⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.';

// URL of the locally trained Python ML chatbot service (see ai-model/).
const LOCAL_MODEL_URL = process.env.LOCAL_MODEL_URL || 'http://localhost:8000/predict';
const LOCAL_MODEL_MIN_CONFIDENCE = Number(process.env.LOCAL_MODEL_MIN_CONFIDENCE || 0.2);
const LOCAL_MODEL_TIMEOUT_MS = 3000;

/**
 * Response priority:
 *   1. Locally trained ML model (ai-model/ — TF-IDF retrieval over a medical Q&A dataset)
 *   2. OpenAI-compatible API, if AI_API_KEY is configured
 *   3. Deterministic rule-based fallback (always available, no dependencies)
 */
export async function buildAIResponse(messages, context = '') {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // ── Mode 1: curated rule-based patterns (checked FIRST) ───────────────────
  // These are hand-written and accurate for a fixed set of common symptoms/
  // topics. Checking them before the ML model avoids the ML model confidently
  // returning an off-topic dataset answer for a query it has a good match for
  // by accident (e.g. "head pain" matching "back pain" on the word "pain").
  const matchedRule = matchRule(lastUserMsg);
  if (matchedRule) return matchedRule;

  // ── Mode 2: locally trained ML model (for anything the rules don't cover) ─
  try {
    const localReply = await callLocalModel(lastUserMsg);
    if (localReply) return withDisclaimer(localReply);
  } catch (err) {
    console.warn('[aiService] Local ML model unavailable, falling back:', err.message);
  }

  // ── Mode 3: OpenAI-compatible call ───────────────────────────────────────
  if (apiKey && apiKey.trim().length > 10) {
    try {
      return await callOpenAI(messages, context, apiKey);
    } catch (err) {
      console.warn('[aiService] OpenAI call failed, falling back to rules:', err.message);
    }
  }

  // ── Mode 4: generic fallback ──────────────────────────────────────────────
  return ruleBasedResponse(messages, context);
}

// ── Local trained model call ─────────────────────────────────────────────────
async function callLocalModel(message) {
  if (!message) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_MODEL_TIMEOUT_MS);

  try {
    const response = await fetch(LOCAL_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.reply || typeof data.confidence !== 'number') return null;
    if (data.confidence < LOCAL_MODEL_MIN_CONFIDENCE) return null;

    return data.reply;
  } catch (err) {
    clearTimeout(timeout);
    throw err; // let caller decide to fall back (e.g. service not running)
  }
}

function withDisclaimer(text) {
  return text.includes('Disclaimer') ? text : `${text}\n\n${DISCLAIMER}`;
}

// ── OpenAI-compatible call ────────────────────────────────────────────────────
async function callOpenAI(messages, context, apiKey) {
  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\nPatient screening context:\n${context}`
    : SYSTEM_PROMPT;

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemContent },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.4,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
const HEALTH_RULES = [
  {
    keywords: ['chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'cannot breathe', 'severe bleeding'],
    response: `🚨 **Emergency Alert**: The symptoms you've described may indicate a life-threatening emergency. Please call **911** (or your local emergency number) immediately or have someone take you to the nearest emergency room.\n\nDo not wait.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['fever', 'temperature', 'hot', 'chills'],
    response: `**Fever Guidance**\n\nA fever (temperature above 38°C / 100.4°F) is usually your body fighting an infection.\n\n**General recommendations:**\n- Rest and stay hydrated (water, electrolyte drinks).\n- Paracetamol (acetaminophen) or ibuprofen can help reduce fever — follow package dosing.\n- Monitor temperature every few hours.\n\n**Seek medical care if:**\n- Temperature exceeds 39.5°C (103°F)\n- Fever lasts more than 3 days\n- Accompanied by severe headache, stiff neck, rash, or confusion\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['diabetes', 'blood sugar', 'glucose', 'thirst', 'frequent urination'],
    response: `**Diabetes & Blood Sugar**\n\nElevated blood sugar can indicate pre-diabetes or diabetes. Key indicators include increased thirst, frequent urination, fatigue, and blurred vision.\n\n**Lifestyle tips:**\n- Reduce refined carbohydrates and sugary beverages.\n- Aim for 30 minutes of moderate exercise most days.\n- Monitor fasting blood glucose regularly.\n- Maintain a healthy weight.\n\n**Consult a doctor** for proper HbA1c testing and personalised management.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['blood pressure', 'hypertension', 'bp', 'systolic', 'diastolic'],
    response: `**Blood Pressure Guidance**\n\nNormal blood pressure is below 120/80 mmHg. Hypertension is ≥ 130/80 mmHg.\n\n**Lifestyle measures:**\n- Reduce sodium (salt) intake.\n- Exercise regularly — aim for 150 min/week.\n- Limit alcohol; quit smoking.\n- Manage stress through relaxation techniques.\n- Maintain a healthy weight (BMI 18.5–24.9).\n\n**Seek medical care if** BP is consistently above 140/90 or you experience headache, dizziness, or vision changes.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['cough', 'cold', 'runny nose', 'sore throat', 'congestion'],
    response: `**Common Cold / Cough**\n\nMost colds are caused by viruses and resolve in 7–10 days.\n\n**Supportive care:**\n- Rest and increase fluid intake.\n- Honey and warm water can soothe a cough.\n- Saline nasal rinses for congestion.\n- OTC decongestants or antihistamines as needed.\n\n**See a doctor if:**\n- Symptoms worsen after day 5.\n- You develop a high fever (>39°C), ear pain, or shortness of breath.\n- Cough persists for more than 3 weeks.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['asthma', 'wheez', 'shortness of breath', 'breathing'],
    response: `**Asthma / Breathing Difficulty**\n\nShortness of breath and wheezing can be signs of asthma or other respiratory conditions.\n\n**Immediate care:**\n- Use your prescribed rescue inhaler (e.g., salbutamol) if available.\n- Sit upright, stay calm, and breathe slowly.\n- Avoid known triggers (dust, smoke, cold air, allergens).\n\n**See a doctor promptly** if breathing difficulty doesn't improve with rescue medication, or if you have no inhaler.\n\n**Go to the ER** if lips or fingertips turn blue, or you cannot complete sentences.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['bmi', 'weight', 'obese', 'overweight'],
    response: `**BMI & Weight Management**\n\nBMI (Body Mass Index) = weight(kg) ÷ height(m)²\n\n| BMI Range | Category |\n|-----------|----------|\n| < 18.5 | Underweight |\n| 18.5–24.9 | Normal |\n| 25–29.9 | Overweight |\n| ≥ 30 | Obese |\n\n**Tips for healthy weight:**\n- Eat a balanced diet rich in vegetables, lean protein, and whole grains.\n- Exercise at least 150 min/week (moderate intensity).\n- Track calories using a food diary app.\n- Seek a dietitian for personalised guidance.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
  {
    keywords: ['headache', 'migraine', 'head pain'],
    response: `**Headache & Migraine**\n\nMost headaches are tension-type or migraine and are not dangerous.\n\n**Self-care:**\n- Rest in a quiet, dark room.\n- Stay hydrated — dehydration is a common trigger.\n- Apply a cold or warm compress to your forehead.\n- OTC pain relievers (paracetamol, ibuprofen) for mild-moderate pain.\n\n**Seek urgent care if:**\n- Sudden, severe "thunderclap" headache.\n- Headache with fever, stiff neck, or rash.\n- Headache following a head injury.\n- Progressive worsening over days.\n\n⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`
  },
];

function matchRule(message) {
  const lower = (message || '').toLowerCase();
  for (const rule of HEALTH_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.response;
    }
  }
  return null;
}

function ruleBasedResponse(messages, context) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

  const matched = matchRule(lastUserMsg);
  if (matched) return matched;

  // Generic fallback
  return `Thank you for your question. As your AI health assistant, I'm here to provide general health information and guidance.

Based on your query, I recommend:

1. **Consult a healthcare professional** — for personalised medical advice based on your specific situation.
2. **Monitor your symptoms** — keep a log of when symptoms occur, their severity, and any potential triggers.
3. **Maintain healthy habits** — adequate sleep (7–9 hrs), balanced nutrition, regular exercise (150 min/week), and stress management are foundations of good health.
4. **Use MediPredict's screening tool** — run a New Screening from your dashboard to get an AI-powered risk assessment based on your current vitals and symptoms.

Is there a specific health concern I can help you with? Please describe your symptoms or question in more detail.

⚠️ Disclaimer: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.`;
}
