# MediPredict-Healthcare 🏥

### Cloud AI-Based Framework for Early Disease Prediction and Personalized Preventive Healthcare

MediPredict-Healthcare is a full-stack healthcare platform designed to support early identification of potential health risks and personalized preventive healthcare. It enables patients to enter health vitals and symptoms, receive preliminary risk assessments, access preventive health guidance, interact with an AI-powered health chatbot, and connect with verified doctors.

The project aims to bridge the gap between personal health monitoring and professional medical care through an integrated digital healthcare platform.

> **Project status:** The full-stack application includes a frontend, backend, and AI chatbot model. Cloud deployment is planned as a future development phase.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [System Architecture](#️-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#️-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#️-running-the-application)
- [Project Structure](#-project-structure)
- [Current Limitations](#️-current-limitations)
- [Future Enhancements](#-future-enhancements)
- [Medical Disclaimer](#️-medical-disclaimer)
- [Developer](#-developer)

---

## 🔍 Overview

MediPredict-Healthcare integrates web technologies and machine learning techniques to provide a convenient platform for preliminary health-risk assessment and preventive healthcare guidance.

The system consists of three major components:

1. **Patient Portal:** Allows users to submit health information, view screening results, track screening history, access the AI chatbot, and find doctors.
2. **Doctor Portal:** Supports doctor registration, credential verification, and consultation request management.
3. **AI Health Chatbot:** Uses a Python-based machine learning approach to retrieve relevant responses from a medical question-and-answer dataset.

---

## ✨ Features

### 👤 Patient Portal

- **User Authentication:** Patient registration and login with JWT-based authentication.
- **Health Screening:** Enter health information, including age, height, weight, blood pressure, fasting blood sugar, temperature, heart rate, and symptoms.
- **Preliminary Risk Assessment:** Displays a risk level and identifies potentially abnormal health measurements.
- **Preventive Health Guidance:** Provides recommendations based on screening inputs and implemented assessment logic.
- **Screening History:** View previous screening records and track changes over time.
- **AI Health Chatbot:** Ask general health-related questions and receive relevant responses from a medical Q&A dataset.
- **Doctor Directory:** Browse doctors by specialization, hospital, or city.
- **Consultation Requests:** Send consultation requests to listed doctors.

### 🩺 Doctor Portal

- **Doctor Registration:** Submit professional credentials, including degree, university, hospital, and specialization.
- **Credential Verification:** Doctor profiles undergo a verification step before being listed in the patient-facing directory.
- **Consultation Management:** Verified doctors can view and respond to patient consultation requests.

### 🤖 AI Health Chatbot

- Python-based chatbot using machine learning techniques.
- TF-IDF vectorization for representing text.
- Cosine similarity for identifying relevant responses.
- Designed to work with a medical question-and-answer dataset.
- Includes safety-oriented messaging, medical disclaimers, and guidance to seek professional care when appropriate.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 18, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (JWT) |
| AI Chatbot | Python, scikit-learn |
| Text Processing | TF-IDF Vectorization |
| Response Matching | Cosine Similarity |
| Version Control | Git, GitHub |

---

## 🏗️ System Architecture

The application is organized into three primary components:

```text
                 ┌──────────────────────┐
                 │   React Frontend      │
                 │    Vite + JavaScript  │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Node.js Backend     │
                 │   Express + JWT       │
                 └───────┬────────┬─────┘
                         │        │
                         ▼        ▼
               ┌────────────┐  ┌─────────────────┐
               │ PostgreSQL│  │ Python AI Model │
               │ Database  │  │ TF-IDF + Cosine │
               └────────────┘  └─────────────────┘
```

The frontend communicates with the backend through API requests. The backend manages authentication and application data, while the AI component provides chatbot responses using its configured medical Q&A dataset.

---

## 📋 Prerequisites

Install the following software before running the project:

- **Node.js:** Version 18 or later
- **npm:** Included with Node.js
- **Python:** Version 3.9 or later
- **PostgreSQL:** A running local or remote database instance
- **Git:** For cloning and version control

Verify your installations:

```bash
node --version
npm --version
python --version
git --version
```

You may use `python3 --version` instead of `python --version` on some systems.

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Shrilashmi/MediPredict-Healthcare.git
cd MediPredict-Healthcare
```

### 2. Configure the PostgreSQL Database

Start PostgreSQL and connect using an administrative account.

Create the database:

```sql
CREATE DATABASE medipredict;
```

Create a dedicated database user and grant the required permissions:

```sql
CREATE USER medipredict_user WITH PASSWORD 'your_strong_password_here';

GRANT CONNECT ON DATABASE medipredict TO medipredict_user;
```

Connect to the `medipredict` database and grant the permissions required by your application's schema and migrations.

**Note:** Use a strong, private password. The commands above may need additional schema or table permissions depending on your migration scripts.

### 3. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a local environment file by copying the example:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Edit the `.env` file with your local database credentials and a secure JWT secret.

Install the backend dependencies:

```bash
npm install
```

Run the database migrations:

```bash
npm run migrate
```

Start the backend development server:

```bash
npm run dev
```

The backend is expected to run at:

`http://localhost:4000`

Keep this terminal running.

### 4. Set Up the AI Chatbot

Open a new terminal at the project root and navigate to the AI model directory:

```bash
cd ai-model
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Obtain a suitable medical question-and-answer dataset. MedQuAD is one possible dataset; review its licensing and terms before using it.

Place the prepared dataset at the expected location:

`ai-model/data/medquad.csv`

Train the model:

```bash
python train_model.py --data data/medquad.csv
```

Start the AI service:

```bash
python app.py
```

The AI service is expected to run at:

`http://localhost:8000`

**Note:** Dataset preparation and the model's expected input format must match the training script. Refer to `ai-model/README.md` for project-specific details.

### 5. Set Up the Frontend

Open another terminal at the project root:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend is expected to be available at:

`http://localhost:5173`

Open this URL in your browser to access the application.

### Startup Order

Start the services in the following order:

1. PostgreSQL database
2. Node.js backend
3. Python AI chatbot service
4. React frontend

Keep each service running in its own terminal.

---

## 🔐 Environment Configuration

### Backend Environment Variables

Create `backend/.env` from `backend/.env.example` and configure the following values:

```env
PORT=4000
NODE_ENV=development

PGHOST=localhost
PGPORT=5432
PGDATABASE=medipredict
PGUSER=medipredict_user
PGPASSWORD=your_strong_password_here

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

AI_API_KEY=
LOCAL_MODEL_URL=http://localhost:8000/predict
```

Update the variables according to your actual backend configuration.

### Frontend Environment Variables

If your backend runs at a different address, create `frontend/.env` and configure:

```env
VITE_API_URL=http://localhost:4000
```

The default value is suitable for local development when the backend is running on port 4000.

### Security Best Practices

- Never commit `.env` files.
- Never publish passwords, private keys, or API credentials.
- Keep JWT secrets private and sufficiently random.
- Use environment variables for sensitive configuration.
- Review the repository before making it public.

---

## ▶️ Running the Application

After configuring the database, backend, AI service, and frontend:

1. Open the frontend URL in your browser.
2. Register or log in as a patient.
3. Enter the required health measurements and symptoms.
4. Review the preliminary screening output.
5. Explore screening history and preventive guidance.
6. Try the AI health chatbot.
7. Browse the doctor directory and submit a consultation request.
8. Use the doctor portal to explore the implemented verification and consultation workflows.

The available functionality depends on the current implementation and successful local configuration of all required services.

---

## 📁 Project Structure

The project is organized into separate frontend, backend, and AI model components.

```text
MediPredict-Healthcare/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── ...
│
├── ai-model/
│   ├── requirements.txt
│   ├── train_model.py
│   ├── app.py
│   ├── data/
│   └── README.md
│
├── README.md
└── .gitignore
```

*This is a high-level illustration. Actual folders and files may differ depending on the current repository structure.*

---

## ⚠️ Current Limitations

- Cloud deployment is planned as a future development phase.
- Some frontend modules still use browser-local storage instead of the PostgreSQL-backed API and are pending migration.
- AI chatbot response quality depends on the dataset, preprocessing, and similarity-matching approach.
- Risk assessments and preventive recommendations depend on the implemented assessment logic and should not be interpreted as validated clinical predictions.
- Local execution requires correctly configured database credentials, environment variables, dependencies, and the expected medical Q&A dataset.

---

## 🚀 Future Enhancements

Potential future improvements include:

- Cloud deployment for wider accessibility.
- Migration of remaining browser-local storage modules to the backend API.
- Improved monitoring and error handling.
- Expanded testing and validation of health-screening workflows.
- Evaluation of AI chatbot response quality and safety.
- Improved patient and doctor dashboards.
- Stronger data privacy and access-control mechanisms.

---

## ⚕️ Medical Disclaimer

MediPredict-Healthcare is an academic software project intended for educational and research purposes. It is not a substitute for professional medical advice, diagnosis, or treatment.

Risk assessments, chatbot responses, and preventive recommendations may be incomplete or inaccurate. Do not use this application as the sole basis for medical decisions. Consult a qualified healthcare professional for medical concerns. Seek urgent medical assistance when experiencing a medical emergency.

---

## 👩‍💻 Developer

**Shri Lashmi S J**

GitHub: [@Shrilashmi](https://github.com/Shrilashmi)

Project Repository: [MediPredict-Healthcare](https://github.com/Shrilashmi/MediPredict-Healthcare)

---

## 📄 License

No open-source license has been specified for this repository yet. Until a license is added, do not assume that others have permission to redistribute or reuse the project's code.
