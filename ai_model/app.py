"""
app.py — inference server for the MediPredict medical Q&A chatbot.

Pure scikit-learn TF-IDF + cosine similarity retrieval — no GPU, no deep
learning framework required. Runs comfortably on any laptop CPU.

Run:
    python app.py
Defaults to http://localhost:8000
"""
import os

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity

MODEL_DIR = os.environ.get('MODEL_DIR', 'model')
CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 0.45))

print("Loading model artifacts...")
vectorizer = joblib.load(os.path.join(MODEL_DIR, 'vectorizer.joblib'))
question_vectors = joblib.load(os.path.join(MODEL_DIR, 'question_vectors.joblib'))
qa_pairs = pd.read_pickle(os.path.join(MODEL_DIR, 'qa_pairs.pkl'))
print(f"Loaded {len(qa_pairs)} Q&A pairs.")

app = Flask(__name__)
CORS(app)

FALLBACK_REPLY = (
    "I couldn't find a confident match for that in my medical knowledge base. "
    "Could you rephrase your question, or ask about a specific symptom or condition?"
)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "pairs_loaded": len(qa_pairs)})


@app.route('/predict', methods=['POST'])
def predict():
    body = request.get_json(force=True, silent=True) or {}
    message = (body.get('message') or '').strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    query_vec = vectorizer.transform([message])
    similarities = cosine_similarity(query_vec, question_vectors)[0]
    best_idx = int(similarities.argmax())
    best_score = float(similarities[best_idx])

    if best_score < CONFIDENCE_THRESHOLD:
        return jsonify({
            "reply": FALLBACK_REPLY,
            "matched_question": None,
            "confidence": round(best_score, 4),
        })

    return jsonify({
        "reply": qa_pairs.iloc[best_idx]['answer'],
        "matched_question": qa_pairs.iloc[best_idx]['question'],
        "confidence": round(best_score, 4),
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
