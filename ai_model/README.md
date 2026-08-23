# MediPredict — AI Chatbot Model (ai-model/)

A lightweight, CPU-only medical Q&A chatbot. Uses TF-IDF + cosine similarity
(scikit-learn) to retrieve the closest matching question from a medical
dataset and return its answer. No GPU, no deep learning framework needed.

## 1. Get a free dataset

Pick one (both are free and don't need special permission for student/academic use):

- **MedQuAD** (recommended — NIH-sourced, ~47k medical Q&A pairs):
  https://github.com/abachaa/MedQuAD
  It comes as a set of XML files split by source; there are also cleaned
  CSV mirrors linked from that repo and on Kaggle — search
  "MedQuAD csv kaggle" and download the version with `question` and
  `answer` columns.

- **AI Medical Chatbot dataset** (Hugging Face, simpler flat CSV):
  https://huggingface.co/datasets/ruslanmv/ai-medical-chatbot

Save whichever one you pick as `ai-model/data/medquad.csv` with at least
two columns containing the question text and the answer text (the training
script auto-detects columns with "question"/"answer" in the name).

## 2. Install dependencies (no GPU needed)

```bash
cd ai-model
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## 3. Train the model

```bash
python train_model.py --data data/medquad.csv
```

This creates a `model/` folder with the saved TF-IDF vectorizer and the
Q&A lookup table. Training takes seconds to a couple of minutes on a CPU,
even for tens of thousands of rows.

## 4. Run the chatbot service

```bash
python app.py
```

Starts on `http://localhost:8000`. Test it:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"what are the symptoms of diabetes\"}"
```

## 5. Connect it to your Node backend

Replace `backend/src/services/aiService.js` with the updated version
(see chat instructions) and add this line to `backend/.env`:

```env
LOCAL_MODEL_URL=http://localhost:8000/predict
```

With both the Python service (port 8000) and the Node backend (port 4000)
running, your existing `AIChatbot.jsx` frontend needs **no changes** — it
already calls `/api/chat`, which will now try your trained model first.
