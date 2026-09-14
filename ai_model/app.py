"""
app.py — inference server for the MediPredict medical Q&A chatbot.

TF-IDF + clinical topic-aware retrieval.

This version improves:
- clinical synonym handling
- semantic/topic-aware retrieval
- priority clinical intent detection
- targeted clinical reranking
- wrong-condition rejection
- top-k candidate reranking
- confidence calibration
- ambiguous-match rejection
- common paraphrase handling
- combined symptom routing
- generic vs specific hypertension routing
- asthma/night wheezing routing
- stomach pain after eating routing
- general orthostatic dizziness routing

Existing medical Q&A data and answer content are preserved.

Run:
    python app.py

Default:
    http://localhost:8000
"""

import os
import re

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity


# =========================================================
# CONFIGURATION
# =========================================================

MODEL_DIR = os.environ.get("MODEL_DIR", "model")

CONFIDENCE_THRESHOLD = float(
    os.environ.get("CONFIDENCE_THRESHOLD", 0.45)
)

# Use a larger candidate pool because some clinical paraphrases
# have low raw TF-IDF similarity but become strong matches after
# clinical reranking.
TOP_K = int(
    os.environ.get("TOP_K", 50)
)

MARGIN_THRESHOLD = float(
    os.environ.get("MARGIN_THRESHOLD", 0.035)
)


# =========================================================
# LOAD MODEL
# =========================================================

print("Loading model artifacts...")

vectorizer = joblib.load(
    os.path.join(
        MODEL_DIR,
        "vectorizer.joblib"
    )
)

question_vectors = joblib.load(
    os.path.join(
        MODEL_DIR,
        "question_vectors.joblib"
    )
)

qa_pairs = pd.read_pickle(
    os.path.join(
        MODEL_DIR,
        "qa_pairs.pkl"
    )
)

print(
    f"Loaded {len(qa_pairs)} Q&A pairs."
)


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

CORS(app)


# =========================================================
# FALLBACK RESPONSE
# =========================================================

FALLBACK_REPLY = (
    "I couldn't find a confident match for that in my medical knowledge base. "
    "Could you rephrase your question, or ask about a specific symptom or condition?"
)


# =========================================================
# CLINICAL TOPIC VOCABULARY
# =========================================================

CLINICAL_TOPICS = {

    "asthma": {
        "asthma",
        "wheezing",
        "wheeze",
        "wheezes",
        "airway",
        "airways",
        "bronchial",
        "bronchospasm",
        "inhaler",
        "breathing difficulty",
        "difficulty breathing",
        "shortness of breath",
        "breathlessness",
        "chest tightness",
        "chest feels tight",
    },

    # IMPORTANT:
    # Generic urinary terms are intentionally NOT included here.
    # This prevents every urinary question from being classified
    # as diabetes.
    "diabetes": {
        "diabetes",
        "diabetic",
        "blood sugar",
        "blood glucose",
        "glucose",
        "insulin",
        "type 1 diabetes",
        "type 2 diabetes",
        "prediabetes",
        "excessive thirst",
        "very thirsty",
        "weight loss",
        "unexplained weight loss",
        "losing weight",
        "lost weight",
        "weight without trying",
        "lose weight without trying",
        "blurred vision",
        "blurry vision",
        "very hungry",
        "hunger",
        "slow healing",
        "sores that heal slowly",
        "tingling in the feet",
    },

    # General hypertension.
    "hypertension": {
        "high blood pressure",
        "hypertension",
        "blood pressure",
        "elevated blood pressure",
        "bp",
    },

    # Specific forms of pulmonary hypertension must not
    # be returned for a generic "hypertension" question.
    "pulmonary_hypertension": {
        "pulmonary hypertension",
        "pulmonary pressure",
        "pulmonary artery",
        "pulmonary arteries",
        "pressure in the lungs",
        "high blood pressure in the lungs",
    },

    # Specific portal hypertension must not be returned
    # for a generic "hypertension" question.
    "portal_hypertension": {
        "portal hypertension",
        "portal pressure",
        "portal vein",
        "portal venous",
        "portal circulation",
    },

    "chest_pain": {
        "chest pain",
        "pain in the chest",
        "pain in my chest",
        "chest pressure",
        "pressure in the chest",
        "pressure in my chest",
        "chest discomfort",
        "chest tightness",
        "squeezing chest",
        "squeezing feeling in chest",
        "chest feels squeezed",
    },

    "stomach_pain": {
        "stomach pain",
        "stomach ache",
        "belly pain",
        "belly ache",
        "abdominal pain",
        "pain in the stomach",
        "pain in my stomach",
        "abdomen pain",
        "abdominal discomfort",
        "stomach discomfort",
        "belly discomfort",
    },

    "headache": {
        "headache",
        "head pain",
        "migraine",
        "migraine headache",
        "pain in my head",
    },

    "cough": {
        "cough",
        "coughing",
        "persistent cough",
        "dry cough",
        "wet cough",
    },

    "fever": {
        "fever",
        "febrile",
        "high temperature",
        "temperature",
        "feeling feverish",
        "mild fever",
    },

    "dizziness": {
        "dizziness",
        "dizzy",
        "lightheaded",
        "light headed",
        "light-headed",
        "feeling faint",
        "fainting",
        "faint",
        "vertigo",
        "orthostatic",
        "postural",
        "standing up",
        "stand up",
    },

    "orthostatic_hypotension": {
        "orthostatic hypotension",
        "postural hypotension",
        "low blood pressure when standing",
        "blood pressure drops when standing",
    },

    "pudendal_or_pots_specific": {
        "postural orthostatic tachycardia syndrome",
        "pots",
        "tachycardia when standing",
        "rapid heartbeat when standing",
    },

    "respiratory": {
        "breathing",
        "breathlessness",
        "shortness of breath",
        "difficulty breathing",
        "trouble breathing",
        "breathless",
        "respiratory",
    },

    "urinary": {
        "urination",
        "urinating",
        "urinate",
        "pee",
        "peeing",
        "frequent urination",
        "frequent bathroom trips",
        "bathroom frequently",
    },

    "fatigue": {
        "fatigue",
        "tired",
        "very tired",
        "exhausted",
        "feeling exhausted",
        "weakness",
        "lack of energy",
        "low energy",
    },

    "nausea": {
        "nausea",
        "nauseous",
        "feeling sick",
        "sick to my stomach",
    },

    "vomiting": {
        "vomiting",
        "vomit",
        "throwing up",
        "threw up",
    },

    "diarrhea": {
        "diarrhea",
        "diarrhoea",
        "loose stools",
        "loose stool",
        "watery stool",
    },

    "constipation": {
        "constipation",
        "constipated",
        "difficulty passing stool",
        "hard stools",
    },

    "skin": {
        "rash",
        "itching",
        "itchy skin",
        "skin",
        "acne",
        "pimples",
        "dry skin",
    },

    "back_pain": {
        "back pain",
        "pain in my back",
        "lower back pain",
        "upper back pain",
    },

    "joint_pain": {
        "joint pain",
        "painful joints",
        "joint swelling",
        "arthritis",
    },

    "sore_throat": {
        "sore throat",
        "throat pain",
        "painful throat",
        "scratchy throat",
    },

    "cold": {
        "cold",
        "common cold",
        "runny nose",
        "stuffy nose",
        "blocked nose",
        "nasal congestion",
    },

    "allergy": {
        "allergy",
        "allergic",
        "allergies",
        "hay fever",
    },
}


# =========================================================
# TOPIC CONFLICTS
# =========================================================

STRONG_CONFLICTS = {

    "asthma": {
        "diabetes",
        "stomach_pain",
        "headache",
        "urinary",
    },

    "diabetes": {
        "asthma",
        "stomach_pain",
        "headache",
    },

    "chest_pain": {
        "stomach_pain",
        "headache",
        "diabetes",
    },

    "stomach_pain": {
        "chest_pain",
        "headache",
        "asthma",
    },

    "headache": {
        "stomach_pain",
        "chest_pain",
    },

    "hypertension": {
        "stomach_pain",
        "asthma",
    },
}


# =========================================================
# CLINICAL TEXT NORMALIZATION
# =========================================================

def normalize_clinical_text(text: str):

    text = str(text).lower().strip()

    additions = [

        # -------------------------------------------------
        # Urination
        # -------------------------------------------------

        (
            r"\bgoing to the bathroom\b",
            "frequent urination"
        ),

        (
            r"\busing the bathroom\b",
            "frequent urination"
        ),

        (
            r"\buse the bathroom\b",
            "frequent urination"
        ),

        (
            r"\bgoing to pee\b",
            "frequent urination"
        ),

        (
            r"\bpeeing a lot\b",
            "frequent urination"
        ),

        (
            r"\bpee a lot\b",
            "frequent urination"
        ),

        (
            r"\burinating often\b",
            "frequent urination"
        ),

        (
            r"\bpee frequently\b",
            "frequent urination"
        ),

        (
            r"\bpeeing frequently\b",
            "frequent urination"
        ),

        (
            r"\burinating\b",
            "urination"
        ),

        (
            r"\burinate\b",
            "urination"
        ),

        (
            r"\burinates\b",
            "urination"
        ),

        (
            r"\burination\b",
            "frequent urination"
        ),

        (
            r"\bpee\b",
            "urination"
        ),

        (
            r"\bpeeing\b",
            "urination"
        ),

        # -------------------------------------------------
        # Thirst
        # -------------------------------------------------

        (
            r"\bvery thirsty\b",
            "excessive thirst"
        ),

        (
            r"\bextremely thirsty\b",
            "excessive thirst"
        ),

        (
            r"\bconstant thirst\b",
            "excessive thirst"
        ),

        (
            r"\bconstantly thirsty\b",
            "excessive thirst"
        ),

        (
            r"\bfrequent thirst\b",
            "excessive thirst"
        ),

        (
            r"\bthirsty all the time\b",
            "excessive thirst"
        ),

        (
            r"\bthirst all the time\b",
            "excessive thirst"
        ),

        # -------------------------------------------------
        # Weight loss
        # -------------------------------------------------

        (
            r"\blosing weight\b",
            "weight loss"
        ),

        (
            r"\blost weight\b",
            "weight loss"
        ),

        (
            r"\blose weight without trying\b",
            "unexplained weight loss"
        ),

        (
            r"\bweight loss\b",
            "unexplained weight loss"
        ),

        (
            r"\bweight without trying\b",
            "unexplained weight loss"
        ),

        (
            r"\bwithout trying to lose weight\b",
            "unexplained weight loss"
        ),

        # -------------------------------------------------
        # Wheezing
        # -------------------------------------------------

        (
            r"\bnoisy breathing\b",
            "wheezing"
        ),

        (
            r"\bwhistling sound when i breathe\b",
            "wheezing"
        ),

        (
            r"\bwhistling sound while breathing\b",
            "wheezing"
        ),

        (
            r"\bwhistling when breathing\b",
            "wheezing"
        ),

        (
            r"\bwhistling sound when breathing\b",
            "wheezing"
        ),

        (
            r"\bwhistling noise when breathing\b",
            "wheezing"
        ),

        # -------------------------------------------------
        # Night wheezing
        # -------------------------------------------------

        (
            r"\bwheeze at night\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheezing at night\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheezes at night\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheezing during the night\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheeze during the night\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheezing while sleeping\b",
            "wheezing asthma night"
        ),

        (
            r"\bwheezing at bedtime\b",
            "wheezing asthma night"
        ),

        # -------------------------------------------------
        # Difficulty breathing
        # -------------------------------------------------

        (
            r"\bbreathing difficulty\b",
            "difficulty breathing"
        ),

        (
            r"\btrouble breathing\b",
            "difficulty breathing"
        ),

        (
            r"\bshortness of breath\b",
            "difficulty breathing"
        ),

        (
            r"\bshort of breath\b",
            "difficulty breathing"
        ),

        (
            r"\bbreathless\b",
            "difficulty breathing"
        ),

        (
            r"\bbreathlessness\b",
            "difficulty breathing"
        ),

        (
            r"\bhard to breathe\b",
            "difficulty breathing"
        ),

        (
            r"\bhard time breathing\b",
            "difficulty breathing"
        ),

        (
            r"\bcannot breathe well\b",
            "difficulty breathing"
        ),

        (
            r"\bcan't breathe well\b",
            "difficulty breathing"
        ),

        (
            r"\bcan't catch my breath\b",
            "difficulty breathing"
        ),

        (
            r"\bcan not catch my breath\b",
            "difficulty breathing"
        ),

        # -------------------------------------------------
        # Chest tightness
        # -------------------------------------------------

        (
            r"\bchest is being squeezed\b",
            "chest tightness"
        ),

        (
            r"\bchest feels squeezed\b",
            "chest tightness"
        ),

        (
            r"\bchest feels like it is being squeezed\b",
            "chest tightness"
        ),

        (
            r"\bsqueezing feeling in my chest\b",
            "chest tightness"
        ),

        (
            r"\bpressure in my chest\b",
            "chest pressure chest pain"
        ),

        (
            r"\bchest pressure\b",
            "chest pressure chest pain"
        ),

        (
            r"\bchest discomfort\b",
            "chest pain"
        ),

        # -------------------------------------------------
        # Chest pain
        # -------------------------------------------------

        (
            r"\bpain in my chest\b",
            "chest pain"
        ),

        (
            r"\bpain in the chest\b",
            "chest pain"
        ),

        (
            r"\bchest hurts\b",
            "chest pain"
        ),

        (
            r"\bmy chest hurts\b",
            "chest pain"
        ),

        # -------------------------------------------------
        # Stomach pain
        # -------------------------------------------------

        (
            r"\bstomach ache\b",
            "stomach pain"
        ),

        (
            r"\bbelly pain\b",
            "stomach pain"
        ),

        (
            r"\bbelly ache\b",
            "stomach pain"
        ),

        (
            r"\bpain in my stomach\b",
            "stomach pain"
        ),

        (
            r"\bpain in the stomach\b",
            "stomach pain"
        ),

        (
            r"\bmy stomach hurts\b",
            "stomach pain"
        ),

        (
            r"\babdominal pain\b",
            "stomach pain abdominal pain"
        ),

        (
            r"\bbelly hurts\b",
            "stomach pain"
        ),

        (
            r"\bmy belly hurts\b",
            "stomach pain"
        ),

        (
            r"\babdomen hurts\b",
            "stomach pain abdominal pain"
        ),

        (
            r"\babdomen pain\b",
            "stomach pain abdominal pain"
        ),

        # -------------------------------------------------
        # Eating + stomach
        # -------------------------------------------------

        (
            r"\bafter eating\b",
            "after eating meal food"
        ),

        (
            r"\bafter a meal\b",
            "after eating meal food"
        ),

        (
            r"\bafter meals\b",
            "after eating meal food"
        ),

        (
            r"\bafter food\b",
            "after eating meal food"
        ),

        (
            r"\bwhen i eat\b",
            "after eating meal food"
        ),

        (
            r"\bwhenever i eat\b",
            "after eating meal food"
        ),

        (
            r"\bwhile eating\b",
            "eating meal food"
        ),

        # -------------------------------------------------
        # Headache
        # -------------------------------------------------

        (
            r"\bhead pain\b",
            "headache"
        ),

        (
            r"\bpain in my head\b",
            "headache"
        ),

        (
            r"\bmy head hurts\b",
            "headache"
        ),

        # -------------------------------------------------
        # Dizziness
        # -------------------------------------------------

        (
            r"\bfeeling dizzy\b",
            "dizziness"
        ),

        (
            r"\bfeel dizzy\b",
            "dizziness"
        ),

        (
            r"\blight headed\b",
            "lightheaded dizziness"
        ),

        (
            r"\blight-headed\b",
            "lightheaded dizziness"
        ),

        (
            r"\bfeeling faint\b",
            "dizziness faintness"
        ),

        (
            r"\bfeel faint\b",
            "dizziness faintness"
        ),

        (
            r"\bwhen i stand up\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bwhen i suddenly stand\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bafter standing up\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bwhen i get up\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bafter i get up\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bwhen i rise\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\brising from sitting\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bgetting up suddenly\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bwhen i go from sitting to standing\b",
            "standing up postural orthostatic dizziness"
        ),

        (
            r"\bwhen i move from sitting to standing\b",
            "standing up postural orthostatic dizziness"
        ),

        # -------------------------------------------------
        # Cough
        # -------------------------------------------------

        (
            r"\bcoughing\b",
            "cough"
        ),

        (
            r"\bkeep coughing\b",
            "persistent cough"
        ),

        (
            r"\bkeeps coughing\b",
            "persistent cough"
        ),

        (
            r"\bcough for several days\b",
            "persistent cough"
        ),

        (
            r"\bcoughing for several days\b",
            "persistent cough"
        ),

        (
            r"\bdry cough\b",
            "cough"
        ),

        # -------------------------------------------------
        # Fever
        # -------------------------------------------------

        (
            r"\bfeeling feverish\b",
            "fever"
        ),

        (
            r"\bhigh temperature\b",
            "fever"
        ),

        (
            r"\bmild fever\b",
            "fever"
        ),

        # -------------------------------------------------
        # Fatigue
        # -------------------------------------------------

        (
            r"\bvery tired\b",
            "fatigue"
        ),

        (
            r"\bfeeling exhausted\b",
            "fatigue"
        ),

        (
            r"\bexhausted all the time\b",
            "fatigue"
        ),

        (
            r"\bno energy\b",
            "fatigue low energy"
        ),

        # -------------------------------------------------
        # Nausea
        # -------------------------------------------------

        (
            r"\bfeeling nauseous\b",
            "nausea"
        ),

        (
            r"\bfeel nauseous\b",
            "nausea"
        ),

        (
            r"\bfeel sick\b",
            "nausea"
        ),

        # -------------------------------------------------
        # Vomiting
        # -------------------------------------------------

        (
            r"\bthrowing up\b",
            "vomiting"
        ),

        (
            r"\bthrew up\b",
            "vomiting"
        ),

        # -------------------------------------------------
        # Sore throat
        # -------------------------------------------------

        (
            r"\bthroat hurts\b",
            "sore throat"
        ),

        (
            r"\bpainful throat\b",
            "sore throat"
        ),

        # -------------------------------------------------
        # Common cold
        # -------------------------------------------------

        (
            r"\bblocked nose\b",
            "nasal congestion"
        ),

        (
            r"\bstuffy nose\b",
            "nasal congestion"
        ),

        (
            r"\brunny nose\b",
            "common cold"
        ),
    ]

    for pattern, synonym in additions:

        if re.search(
            pattern,
            text,
            flags=re.IGNORECASE
        ):
            text += " " + synonym

    return text


# =========================================================
# SPECIAL CLINICAL INTENTS
# =========================================================

def detect_special_intents(text):

    original = str(text).lower()
    normalized = normalize_clinical_text(original)

    combined = f"{original} {normalized}"

    intents = set()

    # -----------------------------------------------------
    # Wheezing at night
    # -----------------------------------------------------

    has_wheezing = bool(
        re.search(
            r"\b(wheeze|wheezing|wheezes|whistling)\b",
            combined
        )
    )

    has_night = bool(
        re.search(
            r"\b(night|nighttime|at night|during the night|"
            r"early morning|while sleeping|sleeping|bedtime)\b",
            combined
        )
    )

    if has_wheezing and has_night:
        intents.add("asthma_night")

    # -----------------------------------------------------
    # Diabetes symptom cluster
    # Frequent urination + weight loss
    # -----------------------------------------------------

    has_urination = bool(
        re.search(
            r"\b(frequent urination|urination|urinating|"
            r"peeing|pee|peeing a lot|urinating often|"
            r"going to the bathroom|peeing frequently|"
            r"frequent bathroom trips)\b",
            combined
        )
    )

    has_weight_loss = bool(
        re.search(
            r"\b(weight loss|unexplained weight loss|"
            r"losing weight|lost weight|"
            r"lose weight|weight without trying|"
            r"without trying to lose weight)\b",
            combined
        )
    )

    if has_urination and has_weight_loss:
        intents.add("diabetes_cluster")

    # -----------------------------------------------------
    # Generic hypertension
    #
    # "What does hypertension mean?"
    # "What is hypertension?"
    #
    # Do not route to pulmonary or portal hypertension
    # unless the specific word is present.
    # -----------------------------------------------------

    has_hypertension = bool(
        re.search(
            r"\bhypertension\b",
            original
        )
    )

    has_portal = bool(
        re.search(
            r"\bportal\b",
            original
        )
    )

    has_pulmonary = bool(
        re.search(
            r"\bpulmonary\b",
            original
        )
    )

    if (
        has_hypertension
        and not has_portal
        and not has_pulmonary
    ):
        intents.add("generic_hypertension")

    # -----------------------------------------------------
    # Stomach pain after eating
    # -----------------------------------------------------

    has_stomach_area = bool(
        re.search(
            r"\b(stomach|belly|abdomen|abdominal)\b",
            original
        )
    )

    has_pain = bool(
        re.search(
            r"\b(pain|ache|aches|hurt|hurts|discomfort)\b",
            original
        )
    )

    has_eating = bool(
        re.search(
            r"\b(after eating|after a meal|after meals|"
            r"after food|when i eat|whenever i eat|"
            r"eating|meal|meals|while eating)\b",
            original
        )
    )

    if (
        has_stomach_area
        and has_pain
        and has_eating
    ):
        intents.add("stomach_after_eating")

    # -----------------------------------------------------
    # Dizziness when standing
    # -----------------------------------------------------

    has_dizziness = bool(
        re.search(
            r"\b(dizzy|dizziness|lightheaded|light-headed|"
            r"light headed|faint|fainting|vertigo)\b",
            combined
        )
    )

    has_standing = bool(
        re.search(
            r"\b(stand up|standing up|stood up|get up|"
            r"getting up|rise|rising|postural|orthostatic|"
            r"from sitting to standing)\b",
            combined
        )
    )

    if has_dizziness and has_standing:
        intents.add("orthostatic_dizziness")

    return intents


# =========================================================
# PRIORITY INTENT DETECTION
# =========================================================

def detect_priority_intent(text):

    intents = detect_special_intents(text)

    normalized = normalize_clinical_text(text)

    # Most specific combined conditions first.

    if "diabetes_cluster" in intents:
        return "diabetes"

    if "asthma_night" in intents:
        return "asthma"

    if "generic_hypertension" in intents:
        return "hypertension"

    if "stomach_after_eating" in intents:
        return "stomach_pain"

    if "orthostatic_dizziness" in intents:
        return "dizziness"

    # Explicit condition mentions.

    if "asthma" in normalized:
        return "asthma"

    if (
        "diabetes" in normalized
        or "diabetic" in normalized
        or "blood sugar" in normalized
        or "blood glucose" in normalized
        or "insulin" in normalized
        or "prediabetes" in normalized
    ):
        return "diabetes"

    if (
        "high blood pressure" in normalized
        or "elevated blood pressure" in normalized
        or re.search(
            r"\bhypertension\b",
            normalized
        )
    ):
        return "hypertension"

    if (
        "chest pain" in normalized
        or "chest pressure" in normalized
        or "chest discomfort" in normalized
        or "chest hurts" in normalized
    ):
        return "chest_pain"

    if (
        "stomach pain" in normalized
        or "stomach ache" in normalized
        or "belly pain" in normalized
        or "belly hurts" in normalized
        or "abdominal pain" in normalized
    ):
        return "stomach_pain"

    if (
        "dizziness" in normalized
        or "lightheaded" in normalized
        or "vertigo" in normalized
    ):
        return "dizziness"

    return None


# =========================================================
# TOPIC DETECTION
# =========================================================

def detect_topics(text: str):

    text = str(text).lower()

    detected = set()

    for topic, keywords in CLINICAL_TOPICS.items():

        for keyword in keywords:

            if keyword in text:

                detected.add(topic)
                break

    return detected


# =========================================================
# QUESTION TOKENIZATION
# =========================================================

def clinical_tokens(text: str):

    text = str(text).lower()

    tokens = re.findall(
        r"[a-zA-Z]+",
        text
    )

    stop_words = {
        "a",
        "an",
        "and",
        "are",
        "be",
        "been",
        "being",
        "can",
        "could",
        "do",
        "does",
        "for",
        "from",
        "have",
        "has",
        "how",
        "i",
        "if",
        "in",
        "is",
        "it",
        "me",
        "my",
        "of",
        "on",
        "or",
        "the",
        "this",
        "to",
        "was",
        "what",
        "when",
        "why",
        "with",
        "would",
        "you",
        "your",
    }

    return {
        token
        for token in tokens
        if token not in stop_words
        and len(token) >= 2
    }


# =========================================================
# LEXICAL OVERLAP
# =========================================================

def lexical_overlap(query, candidate):

    query_tokens = clinical_tokens(query)

    candidate_tokens = clinical_tokens(candidate)

    if not query_tokens or not candidate_tokens:
        return 0.0

    intersection = (
        query_tokens
        & candidate_tokens
    )

    union = (
        query_tokens
        | candidate_tokens
    )

    if not union:
        return 0.0

    return len(intersection) / len(union)


# =========================================================
# TOPIC COMPATIBILITY
# =========================================================

def topic_compatibility(
    query_topics,
    candidate_topics
):

    if not query_topics:
        return 0.5

    if not candidate_topics:
        return 0.5

    # Specific hypertension forms are not equivalent
    # to generic hypertension.
    if "hypertension" in query_topics:

        if (
            "pulmonary_hypertension"
            in candidate_topics
            or "portal_hypertension"
            in candidate_topics
        ):
            return 0.0

    if query_topics & candidate_topics:
        return 1.0

    for query_topic in query_topics:

        conflicts = STRONG_CONFLICTS.get(
            query_topic,
            set()
        )

        if conflicts & candidate_topics:
            return 0.0

    return 0.15


# =========================================================
# QUESTION TYPE DETECTION
# =========================================================

def detect_question_type(text: str):

    text = str(text).lower()

    if any(
        phrase in text
        for phrase in [
            "early signs",
            "early symptoms",
            "warning signs",
            "symptoms",
            "signs of",
            "what does it feel like",
            "feel like",
            "how do i know",
        ]
    ):
        return "symptoms"

    if any(
        phrase in text
        for phrase in [
            "what causes",
            "cause of",
            "causing it",
            "caused by",
            "why do i",
            "why am i",
            "reason for",
        ]
    ):
        return "causes"

    if any(
        phrase in text
        for phrase in [
            "what is",
            "what are",
            "explain",
            "meaning of",
            "define",
            "what does",
        ]
    ):
        return "definition"

    if any(
        phrase in text
        for phrase in [
            "test",
            "testing",
            "diagnose",
            "diagnosis",
            "screening",
        ]
    ):
        return "testing"

    if any(
        phrase in text
        for phrase in [
            "treatment",
            "treat",
            "cure",
            "manage",
            "management",
        ]
    ):
        return "treatment"

    return "general"


# =========================================================
# QUESTION TYPE COMPATIBILITY
# =========================================================

def question_type_compatibility(
    query,
    candidate
):

    query_type = detect_question_type(
        query
    )

    candidate_type = detect_question_type(
        candidate
    )

    if query_type == candidate_type:
        return 1.0

    if (
        query_type == "general"
        or candidate_type == "general"
    ):
        return 0.85

    related = {

        ("symptoms", "general"),
        ("general", "symptoms"),

        ("causes", "general"),
        ("general", "causes"),

        ("definition", "general"),
        ("general", "definition"),

        ("causes", "symptoms"),
        ("symptoms", "causes"),
    }

    if (
        query_type,
        candidate_type
    ) in related:
        return 0.90

    return 0.75


# =========================================================
# SPECIAL INTENT COMPATIBILITY
# =========================================================

def special_intent_compatibility(
    special_intents,
    candidate_question,
    candidate_topics
):

    if not special_intents:
        return 0.5

    candidate = str(
        candidate_question
    ).lower()

    score = 0.5

    # -----------------------------------------------------
    # Asthma at night
    # -----------------------------------------------------

    if "asthma_night" in special_intents:

        if (
            "asthma" in candidate_topics
            or "wheez" in candidate
            or "wheezing" in candidate
            or "night" in candidate
        ):
            score = max(
                score,
                1.0
            )

        elif (
            "chest_pain" in candidate_topics
            or "diabetes" in candidate_topics
            or "stomach_pain" in candidate_topics
        ):
            score = min(
                score,
                0.0
            )

    # -----------------------------------------------------
    # Diabetes symptom cluster
    # -----------------------------------------------------

    if "diabetes_cluster" in special_intents:

        if "diabetes" in candidate_topics:
            score = max(
                score,
                1.0
            )

        elif "urinary" in candidate_topics:
            score = min(
                score,
                0.10
            )

    # -----------------------------------------------------
    # Generic hypertension
    # -----------------------------------------------------

    if "generic_hypertension" in special_intents:

        if (
            "pulmonary_hypertension"
            in candidate_topics
            or "portal_hypertension"
            in candidate_topics
        ):
            score = min(
                score,
                0.0
            )

        elif "hypertension" in candidate_topics:
            score = max(
                score,
                1.0
            )

    # -----------------------------------------------------
    # Stomach pain after eating
    # -----------------------------------------------------

    if "stomach_after_eating" in special_intents:

        if "stomach_pain" in candidate_topics:
            score = max(
                score,
                1.0
            )

        elif "chest_pain" in candidate_topics:
            score = min(
                score,
                0.20
            )

    # -----------------------------------------------------
    # Dizziness when standing
    #
    # Prefer a general dizziness/orthostatic answer.
    # Do not jump directly to POTS unless POTS is
    # explicitly mentioned.
    # -----------------------------------------------------

    if "orthostatic_dizziness" in special_intents:

        if "dizziness" in candidate_topics:
            score = max(
                score,
                1.0
            )

        if (
            "hypertension" in candidate_topics
            or "chest_pain" in candidate_topics
        ):
            score = min(
                score,
                0.15
            )

        if (
            "pudendal_or_pots_specific"
            in candidate_topics
        ):
            score = min(
                score,
                0.15
            )

        if (
            "orthostatic_hypotension"
            in candidate_topics
        ):
            score = max(
                score,
                1.0
            )

        # General candidate wording is preferred over
        # a disease-specific syndrome.
        if any(
            phrase in candidate
            for phrase in [
                "dizziness",
                "lightheaded",
                "light headed",
                "faint",
                "orthostatic hypotension",
                "postural hypotension",
                "standing",
                "stand up",
            ]
        ):
            if "pots" not in candidate:
                score = max(
                    score,
                    1.0
                )

    return float(score)


# =========================================================
# CANDIDATE SCORING
# =========================================================

def score_candidate(
    tfidf_score,
    lexical_score,
    topic_score,
    question_type_score,
    special_score=0.5
):

    score = (

        (tfidf_score * 0.55)

        + (lexical_score * 0.10)

        + (topic_score * 0.17)

        + (question_type_score * 0.06)

        + (special_score * 0.12)

    )

    return float(score)


# =========================================================
# FIND BEST CLINICAL MATCH
# =========================================================

def find_best_match(
    message,
    normalized_message
):

    query_vec = vectorizer.transform([
        normalized_message
    ])

    similarities = cosine_similarity(
        query_vec,
        question_vectors
    )[0]

    total_candidates = len(
        similarities
    )

    if total_candidates == 0:

        return (
            None,
            0.0,
            0.0,
            0.0,
            {}
        )

    # -----------------------------------------------------
    # TOP K
    # -----------------------------------------------------

    k = min(
        TOP_K,
        total_candidates
    )

    top_indices = similarities.argsort()[
        -k:
    ][::-1]

    # -----------------------------------------------------
    # QUERY TOPICS
    # -----------------------------------------------------

    query_topics = detect_topics(
        normalized_message
    )

    query_topics.update(
        detect_topics(message)
    )

    # -----------------------------------------------------
    # SPECIAL INTENTS
    # -----------------------------------------------------

    special_intents = detect_special_intents(
        message
    )

    priority_intent = detect_priority_intent(
        message
    )

    candidates = []

    # -----------------------------------------------------
    # EVALUATE CANDIDATE
    # -----------------------------------------------------

    def evaluate_candidate(idx):

        candidate_question = str(
            qa_pairs.iloc[idx]["question"]
        )

        candidate_normalized = (
            normalize_clinical_text(
                candidate_question
            )
        )

        candidate_topics = detect_topics(
            candidate_normalized
        )

        raw_score = float(
            similarities[idx]
        )

        lexical_score = lexical_overlap(
            normalized_message,
            candidate_normalized
        )

        topic_score = topic_compatibility(
            query_topics,
            candidate_topics
        )

        question_type_score = (
            question_type_compatibility(
                normalized_message,
                candidate_question
            )
        )

        special_score = (
            special_intent_compatibility(
                special_intents,
                candidate_question,
                candidate_topics
            )
        )

        final_score = score_candidate(
            raw_score,
            lexical_score,
            topic_score,
            question_type_score,
            special_score
        )

        # -------------------------------------------------
        # GENERIC HYPERTENSION SAFETY
        # -------------------------------------------------

        if (
            "generic_hypertension"
            in special_intents
            and (
                "portal_hypertension"
                in candidate_topics
                or "pulmonary_hypertension"
                in candidate_topics
            )
        ):

            final_score *= 0.03

        # -------------------------------------------------
        # DIABETES CLUSTER SAFETY
        # -------------------------------------------------

        if (
            "diabetes_cluster"
            in special_intents
            and "urinary"
            in candidate_topics
            and "diabetes"
            not in candidate_topics
        ):

            final_score *= 0.20

        # -------------------------------------------------
        # POTS SAFETY
        # -------------------------------------------------

        if (
            "orthostatic_dizziness"
            in special_intents
            and "pudendal_or_pots_specific"
            in candidate_topics
        ):

            # Only allow POTS as a strong match when the
            # user actually mentions POTS or tachycardia.
            explicit_pots = bool(
                re.search(
                    r"\b(pots|postural orthostatic "
                    r"tachycardia|rapid heartbeat|"
                    r"tachycardia)\b",
                    message.lower()
                )
            )

            if not explicit_pots:
                final_score *= 0.25

        # -------------------------------------------------
        # SPECIAL INTENT BOOST / PENALTY
        # -------------------------------------------------

        if special_score >= 1.0:

            final_score += 0.14

        elif special_score <= 0.10:

            final_score *= 0.30

        # -------------------------------------------------
        # HARD TOPIC CONFLICT
        # -------------------------------------------------

        if topic_score == 0.0:

            final_score *= 0.15

        elif topic_score == 0.15:

            final_score *= 0.65

        return {

            "idx": int(idx),

            "raw_score": raw_score,

            "lexical_score": lexical_score,

            "topic_score": topic_score,

            "question_type_score": (
                question_type_score
            ),

            "special_score": special_score,

            "final_score": float(
                final_score
            ),

            "topics": list(
                candidate_topics
            ),

        }

    # -----------------------------------------------------
    # NORMAL TOP-K RERANKING
    # -----------------------------------------------------

    for idx in top_indices:

        candidates.append(
            evaluate_candidate(
                int(idx)
            )
        )

    # -----------------------------------------------------
    # TARGETED SEARCH
    #
    # For special clinical intents, inspect all candidates
    # belonging to the relevant clinical topic.
    #
    # This is deliberately based on the existing dataset;
    # no medical Q&A is added or removed here.
    # -----------------------------------------------------

    if special_intents:

        targeted_indices = set()

        for idx in range(
            total_candidates
        ):

            candidate_question = str(
                qa_pairs.iloc[idx]["question"]
            )

            candidate_normalized = (
                normalize_clinical_text(
                    candidate_question
                )
            )

            candidate_topics = detect_topics(
                candidate_normalized
            )

            candidate_special_score = (
                special_intent_compatibility(
                    special_intents,
                    candidate_question,
                    candidate_topics
                )
            )

            # Relevant clinical candidates.
            if candidate_special_score >= 1.0:

                targeted_indices.add(
                    int(idx)
                )

        existing_indices = {
            item["idx"]
            for item in candidates
        }

        # Evaluate all targeted candidates, but only add
        # those not already in the normal TOP-K list.
        for idx in targeted_indices:

            if idx in existing_indices:
                continue

            candidates.append(
                evaluate_candidate(idx)
            )

    # -----------------------------------------------------
    # SORT
    # -----------------------------------------------------

    candidates.sort(
        key=lambda item: item["final_score"],
        reverse=True
    )

    if not candidates:

        return (
            None,
            0.0,
            0.0,
            0.0,
            {}
        )

    best = candidates[0]

    second = (
        candidates[1]
        if len(candidates) > 1
        else None
    )

    second_score = (
        second["final_score"]
        if second
        else 0.0
    )

    return (

        best["idx"],

        float(
            best["final_score"]
        ),

        float(
            best["raw_score"]
        ),

        float(
            second_score
        ),

        {

            "query_topics": list(
                query_topics
            ),

            "special_intents": list(
                special_intents
            ),

            "priority_intent": (
                priority_intent
            ),

            "candidates": candidates[:10],

        }

    )


# =========================================================
# CONFIDENCE CALIBRATION
# =========================================================

def calibrated_confidence(
    final_score,
    raw_score,
    margin,
    topic_score,
    special_score=0.5
):

    confidence = final_score

    # Strong topic agreement
    if topic_score >= 1.0:

        confidence += 0.03

    elif topic_score <= 0.15:

        confidence -= 0.08

    # Strong special intent agreement
    if special_score >= 1.0:

        confidence += 0.03

    # Good separation
    if margin >= 0.10:

        confidence += 0.03

    elif margin < 0.03:

        confidence -= 0.04

    # -----------------------------------------------------
    # Confidence ceiling
    #
    # Normal matches should remain closely tied to their
    # TF-IDF evidence.
    #
    # Targeted clinical matches are allowed a larger
    # evidence gap because the special intent itself is
    # strong evidence.
    # -----------------------------------------------------

    if (
        special_score >= 1.0
        and raw_score >= 0.10
    ):

        confidence = min(
            confidence,
            raw_score + 0.30
        )

    else:

        confidence = min(
            confidence,
            raw_score + 0.16
        )

    confidence = max(
        0.0,
        min(
            1.0,
            confidence
        )
    )

    return float(
        confidence
    )


# =========================================================
# ANSWER CLEANING
# =========================================================

def clean_answer(
    answer,
    question=None
):

    if not answer:
        return FALLBACK_REPLY

    answer = str(answer).strip()

    # -----------------------------------------------------
    # COMMON SPACING FIXES
    # -----------------------------------------------------

    spacing_fixes = [

        (
            r"\bnarrowedairways\b",
            "narrowed airways"
        ),

        (
            r"\bshortness?ofbreath\b",
            "shortness of breath"
        ),

        (
            r"\bshortperiod\b",
            "short period"
        ),

        (
            r"\bshortperiods\b",
            "short periods"
        ),

        (
            r"\b8hours\b",
            "8 hours"
        ),

        (
            r"\b2hours\b",
            "2 hours"
        ),

        (
            r"\btot he\b",
            "to the"
        ),

        (
            r"\bfrombelow\b",
            "from below"
        ),

        (
            r"\baftera\b",
            "after a"
        ),

        (
            r"\bwitha\b",
            "with a"
        ),

        (
            r"\bandyou\b",
            "and you"
        ),

        (
            r"\byoudont\b",
            "you don't"
        ),

        (
            r"\bdont\b",
            "don't"
        ),

        (
            r"\bdoesnt\b",
            "doesn't"
        ),

        (
            r"\bproblemssuch\b",
            "problems such"
        ),

        (
            r"\bclearsymptoms\b",
            "clear symptoms"
        ),

        (
            r"\bhealthproblemssuch\b",
            "health problems such"
        ),
    ]

    for pattern, replacement in spacing_fixes:

        answer = re.sub(
            pattern,
            replacement,
            answer,
            flags=re.IGNORECASE
        )

    # -----------------------------------------------------
    # REMOVE COMMON DATASET SOURCE INTRODUCTIONS
    # -----------------------------------------------------

    source_phrases = [

        (
            "The Human Phenotype Ontology provides the following "
            "list of signs and symptoms for"
        ),

        (
            "The Human Phenotype Ontology provides the following "
            "list of signs and symptoms of"
        ),

        (
            "The Human Phenotype Ontology provides the following "
            "information about"
        ),

        "According to the Human Phenotype Ontology",
    ]

    lower_answer = answer.lower()

    for phrase in source_phrases:

        phrase_lower = phrase.lower()

        if phrase_lower in lower_answer:

            index = lower_answer.find(
                phrase_lower
            )

            before = answer[:index].strip()

            if before:

                answer = before

            else:

                answer = answer[
                    index + len(phrase):
                ].strip(" :-")

            break

    # -----------------------------------------------------
    # REMOVE DATASET-STYLE LABELS
    # -----------------------------------------------------

    answer = re.sub(
        r"^\s*(summary|answer|response)\s*:\s*",
        "",
        answer,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # REMOVE OLD TIME-SPECIFIC STATISTIC
    # -----------------------------------------------------

    answer = re.sub(
        r"An estimated 8 million people in the United States "
        r"have type 2 diabetes.*?\\.",
        "",
        answer,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # REMOVE DATASET NAVIGATION PHRASES
    # -----------------------------------------------------

    answer = re.sub(
        r"\s*Get more details about tests for diabetes\.?",
        "",
        answer,
        flags=re.IGNORECASE
    )

    answer = re.sub(
        r"\s*See risk factors for type 2 diabetes\.?",
        "",
        answer,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # REMOVE SOURCE ATTRIBUTION
    # -----------------------------------------------------

    answer = re.sub(
        r"\s*(NIH|National Institutes? of Health|MedlinePlus)"
        r"\s*:\s*[^.]*\.?\s*$",
        "",
        answer,
        flags=re.IGNORECASE
    )

    # -----------------------------------------------------
    # NORMALIZE WHITESPACE
    # -----------------------------------------------------

    answer = re.sub(
        r"[ \t]+",
        " ",
        answer
    ).strip()

    # -----------------------------------------------------
    # READABILITY HEADINGS
    # -----------------------------------------------------

    headings = [

        "Common Signs",

        "Tests for Diabetes",

        "Who Should Get Tested?",

        "Why Early Detection is Important",
    ]

    for heading in headings:

        answer = re.sub(
            rf"\s*{re.escape(heading)}\s*",
            f"\n\n{heading}\n",
            answer,
            flags=re.IGNORECASE
        )

    # -----------------------------------------------------
    # BULLETS
    # -----------------------------------------------------

    answer = re.sub(
        r"\s+-\s+",
        "\n- ",
        answer
    )

    # -----------------------------------------------------
    # BLANK LINES
    # -----------------------------------------------------

    answer = re.sub(
        r"\n{3,}",
        "\n\n",
        answer
    ).strip()

    # -----------------------------------------------------
    # REMOVE EXACT DUPLICATE SENTENCES
    # -----------------------------------------------------

    sentences = re.split(
        r"(?<=[.!?])\s+",
        answer
    )

    cleaned_sentences = []

    seen = set()

    for sentence in sentences:

        sentence = sentence.strip()

        if not sentence:
            continue

        key = re.sub(
            r"[^a-z0-9\s]",
            "",
            sentence.lower()
        )

        key = re.sub(
            r"\s+",
            " ",
            key
        ).strip()

        if key not in seen:

            cleaned_sentences.append(
                sentence
            )

            seen.add(key)

    answer = "\n".join(
        cleaned_sentences
    )

    # -----------------------------------------------------
    # REMOVE DUPLICATED DIABETES SYMPTOM LIST
    # -----------------------------------------------------

    duplicate_diabetes_list = re.compile(

        r"(\bhaving blurry eyesight\.)\s+"

        r"being very thirsty\s+"

        r"frequent urination\s+"

        r"feeling very hungry or tired\s+"

        r"losing weight without trying\s+"

        r"having sores that heal slowly\s+"

        r"having dry, itchy skin\s+"

        r"loss of feeling or tingling in the feet\s+"

        r"having blurry eyesight\.",

        flags=re.IGNORECASE
    )

    answer = duplicate_diabetes_list.sub(
        r"\1",
        answer
    )

    # -----------------------------------------------------
    # TRAILING PUNCTUATION
    # -----------------------------------------------------

    answer = re.sub(
        r"\.{3,}$",
        "",
        answer
    ).strip()

    # -----------------------------------------------------
    # FINAL PUNCTUATION
    # -----------------------------------------------------

    if answer and not answer.endswith(
        (".", "!", "?")
    ):

        answer += "."

    return answer


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "ok",

        "pairs_loaded": len(
            qa_pairs
        )

    })


# =========================================================
# PREDICT / CHATBOT ENDPOINT
# =========================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    body = request.get_json(
        force=True,
        silent=True
    ) or {}

    message = (
        body.get("message") or ""
    ).strip()

    if not message:

        return jsonify({

            "error": "message is required"

        }), 400

    # -----------------------------------------------------
    # NORMALIZE
    # -----------------------------------------------------

    normalized_message = (
        normalize_clinical_text(
            message
        )
    )

    # -----------------------------------------------------
    # FIND BEST MATCH
    # -----------------------------------------------------

    (
        best_idx,
        final_score,
        raw_score,
        second_score,
        debug_info
    ) = find_best_match(
        message,
        normalized_message
    )

    # -----------------------------------------------------
    # NO CANDIDATE
    # -----------------------------------------------------

    if best_idx is None:

        return jsonify({

            "reply": FALLBACK_REPLY,

            "matched_question": None,

            "confidence": 0.0,

        })

    # -----------------------------------------------------
    # MARGIN
    # -----------------------------------------------------

    margin = (
        final_score
        - second_score
    )

    # -----------------------------------------------------
    # BEST CANDIDATE
    # -----------------------------------------------------

    best_candidate = (
        debug_info["candidates"][0]
        if debug_info.get("candidates")
        else {}
    )

    topic_score = float(
        best_candidate.get(
            "topic_score",
            0.5
        )
    )

    special_score = float(
        best_candidate.get(
            "special_score",
            0.5
        )
    )

    priority_intent = debug_info.get(
        "priority_intent"
    )

    special_intents = set(
        debug_info.get(
            "special_intents",
            []
        )
    )

    # -----------------------------------------------------
    # CALIBRATED CONFIDENCE
    # -----------------------------------------------------

    confidence = calibrated_confidence(
        final_score,
        raw_score,
        margin,
        topic_score,
        special_score
    )

    # -----------------------------------------------------
    # PRIORITY INTENT BOOST
    #
    # Only applies when:
    # - topic matches
    # - special intent matches
    # - actual TF-IDF similarity is reasonable
    # -----------------------------------------------------

    if (
        priority_intent
        and topic_score >= 1.0
        and special_score >= 1.0
        and raw_score >= 0.20
    ):

        confidence = min(
            1.0,
            confidence + 0.04
        )

    # -----------------------------------------------------
    # SPECIAL CLINICAL MATCH RELIABILITY
    #
    # If the query has a strong, specific clinical intent
    # and the selected candidate belongs to the intended
    # topic, permit the calibrated confidence to pass the
    # normal threshold even when TF-IDF similarity is
    # relatively low.
    #
    # This is still bounded and does not create confidence
    # from nothing.
    # -----------------------------------------------------

    if (
        special_score >= 1.0
        and topic_score >= 1.0
        and raw_score >= 0.10
    ):

        confidence = max(
            confidence,
            min(
                0.82,
                0.48 + (
                    raw_score * 0.50
                )
            )
        )

    # -----------------------------------------------------
    # SAFETY / RELEVANCE CHECK
    # -----------------------------------------------------

    query_topics = set(
        debug_info.get(
            "query_topics",
            []
        )
    )

    candidate_topics = set(
        best_candidate.get(
            "topics",
            []
        )
    )

    has_topic_conflict = False

    for query_topic in query_topics:

        conflicts = STRONG_CONFLICTS.get(
            query_topic,
            set()
        )

        if conflicts & candidate_topics:

            has_topic_conflict = True

            break

    # -----------------------------------------------------
    # GENERIC HYPERTENSION SAFETY
    # -----------------------------------------------------

    if (
        "generic_hypertension"
        in special_intents
        and (
            "portal_hypertension"
            in candidate_topics
            or "pulmonary_hypertension"
            in candidate_topics
        )
    ):

        has_topic_conflict = True

    # -----------------------------------------------------
    # DIABETES CLUSTER SAFETY
    # -----------------------------------------------------

    if (
        "diabetes_cluster"
        in special_intents
        and "urinary"
        in candidate_topics
        and "diabetes"
        not in candidate_topics
    ):

        has_topic_conflict = True

    # -----------------------------------------------------
    # POTS SAFETY
    # -----------------------------------------------------

    if (
        "orthostatic_dizziness"
        in special_intents
        and "pudendal_or_pots_specific"
        in candidate_topics
    ):

        explicit_pots = bool(
            re.search(
                r"\b(pots|postural orthostatic "
                r"tachycardia|rapid heartbeat|"
                r"tachycardia)\b",
                message.lower()
            )
        )

        if not explicit_pots:

            has_topic_conflict = True

    if has_topic_conflict:

        return jsonify({

            "reply": FALLBACK_REPLY,

            "matched_question": None,

            "confidence": round(
                confidence,
                4
            ),

        })

    # -----------------------------------------------------
    # CONFIDENCE THRESHOLD
    # -----------------------------------------------------

    if confidence < CONFIDENCE_THRESHOLD:

        return jsonify({

            "reply": FALLBACK_REPLY,

            "matched_question": None,

            "confidence": round(
                confidence,
                4
            ),

        })

    # -----------------------------------------------------
    # AMBIGUOUS MATCH CHECK
    #
    # Special clinical intents are constrained by the
    # clinical reranking layer.
    # -----------------------------------------------------

    if (
        not priority_intent
        and margin < MARGIN_THRESHOLD
        and topic_score < 1.0
        and raw_score < 0.65
    ):

        return jsonify({

            "reply": FALLBACK_REPLY,

            "matched_question": None,

            "confidence": round(
                confidence,
                4
            ),

        })

    # -----------------------------------------------------
    # RETURN MATCHED ANSWER
    # -----------------------------------------------------

    return jsonify({

        "reply": clean_answer(
            qa_pairs.iloc[best_idx]["answer"],
            message
        ),

        "matched_question": (
            qa_pairs.iloc[best_idx]["question"]
        ),

        "confidence": round(
            confidence,
            4
        ),

    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            8000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )