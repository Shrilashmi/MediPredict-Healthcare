import joblib
import pickle
import numpy as np

# Load trained model
v = joblib.load("model/vectorizer.joblib")
X = joblib.load("model/question_vectors.joblib")
qa = pickle.load(open("model/qa_pairs.pkl", "rb"))

questions = [
    "Why does my stomach hurt?",
    "Why do I feel tired all the time?",
    "Why do I keep getting headaches?",
    "What are the warning signs of diabetes?",
    "Why am I urinating so often?",
    "Why am I having trouble breathing?",
    "Why am I wheezing?",
    "Why does my chest feel tight?"
]

Q = v.transform(questions)
sims = (Q @ X.T).toarray()

print("\n--- CLINICAL RETRIEVAL RESULTS ---\n")

for i, question in enumerate(questions):
    best_index = np.argmax(sims[i])

    print("User question:")
    print(question)

    print("Matched dataset question:")
    print(qa.iloc[best_index]["question"])

    print("Similarity:")
    print(f"{sims[i].max():.4f}")

    print("-" * 60)