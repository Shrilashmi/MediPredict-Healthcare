import app
from sklearn.metrics.pairwise import cosine_similarity

tests = [
    "I hear a whistling sound when I breathe",
    "My chest feels like it is being squeezed",
    "I have pain in my stomach after eating",
    "I keep needing to pee and I am extremely thirsty",
    "Why am I feeling tired all the time?",
    "What causes frequent headaches?",
    "What are the warning signs of diabetes?"
]

for q in tests:
    normalized = app.normalize_clinical_text(q)
    query_vec = app.vectorizer.transform([normalized])
    scores = cosine_similarity(query_vec, app.question_vectors)[0]
    top_indices = scores.argsort()[-5:][::-1]

    print("\nQUERY:", q)
    print("NORMALIZED:", normalized)
    print("TOP MATCHES:")

    for i in top_indices:
        print(
            "  ",
            round(float(scores[i]), 4),
            "|",
            app.qa_pairs.iloc[i]["question"]
        )