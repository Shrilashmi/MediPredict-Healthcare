# MediPredict

**Cloud AI-based framework for early disease prediction and personalised preventive healthcare.**

MediPredict is a full-stack web platform that helps patients catch early warning
signs of common health problems from their vitals, get instant preventive
guidance, chat with an AI health assistant, and connect with verified doctors —
closing the loop between self-monitoring and professional care. This repo
currently contains the full-stack application (frontend + backend + AI
chatbot model); cloud deployment is the next phase of the project.

---

## What it does

### Patient portal
- Sign up / log in with secure authentication.
- Run a **health screening** — enter vitals (age, height, weight, blood
  pressure, fasting blood sugar, temperature, heart rate) and symptoms.
- Get an instant **risk assessment**: risk level, which vitals are abnormal
  and why, and tailored **preventive recommendations**.
- View **screening history** to track trends over time.
- Ask the **AI health chatbot** general medical questions — trained on a
  real medical Q&A dataset, with built-in safety guardrails (always
  recommends professional care, flags emergencies, adds a medical
  disclaimer).
- **Find a doctor** — browse verified doctors by specialization, hospital,
  or city, and send a consultation request.

### Doctor portal
- Doctors onboard with their credentials (degree, university, hospital,
  specialization) and go through a **verification step** before appearing
  in the patient-facing directory.
- Verified doctors can view and respond to consultation requests.

---

## Tech stack

| Layer      | Stack |
|------------|-------|
| Frontend   | React 18 + Vite |
| Backend    | Node.js + Express + PostgreSQL (JWT auth) |
| AI Chatbot | Python + scikit-learn (TF-IDF + cosine similarity, CPU-only) |

---

## Prerequisites

- Node.js (v18+) and npm
- Python 3.9+
- PostgreSQL (running locally or accessible remotely)
- Git

---

## Local setup

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Database
```bash
psql -U postgres
CREATE DATABASE medipredict;
CREATE USER medipredict_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE medipredict TO medipredict_user;
\q
```

### 3. Backend
```bash
cd backend
cp .env.example .env      # then fill in PGPASSWORD and JWT_SECRET
npm install
npm run migrate
npm run dev
```
Runs on `http://localhost:4000`.

### 4. AI chatbot model
```bash
cd ai-model
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```
Download a free medical Q&A dataset (see `ai-model/README.md` for links —
MedQuAD is recommended) and save it as `ai-model/data/medquad.csv`, then:
```bash
python train_model.py --data data/medquad.csv
python app.py
```
Runs on `http://localhost:8000`.

### 5. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

**Start order:** database → backend → ai-model → frontend.

---

## Environment variables

`backend/.env` (copy from `backend/.env.example`):
```
PORT=4000
NODE_ENV=development
PGHOST=localhost
PGPORT=5432
PGDATABASE=medipredict
PGUSER=medipredict_user
PGPASSWORD=your_strong_password_here
JWT_SECRET=generate_a_long_random_secret
JWT_EXPIRES_IN=7d
AI_API_KEY=
LOCAL_MODEL_URL=http://localhost:8000/predict
```

`frontend/.env` (optional — only needed if the backend isn't on
`localhost:4000`):
```
VITE_API_URL=http://localhost:4000
```

---

## For teammates: setting up from GitHub

1. Ask the repo owner to add you as a collaborator (GitHub repo → Settings →
   Collaborators), or fork the repo if you don't have write access.
2. Clone it:
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```
3. Follow the **Local setup** steps above (database → backend → ai-model →
   frontend) — every teammate needs their own local Postgres instance and
   their own `.env` files (never commit `.env`).
4. Create a new branch for your work, don't commit directly to `main`:
   ```bash
   git checkout -b your-feature-name
   ```
5. Push your branch and open a Pull Request for review:
   ```bash
   git push origin your-feature-name
   ```

---

## Project status

Full-stack application is functional. Some frontend modules still read from
local browser storage rather than the Postgres-backed API and are pending
migration. Cloud deployment (the "Cloud AI" phase) is planned next.
