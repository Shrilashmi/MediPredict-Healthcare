"""
train_model.py — trains a lightweight, CPU-only medical Q&A retrieval model.

Approach: TF-IDF vectorization + cosine similarity (no neural nets, no GPU).
Given a user question, at inference time we find the closest question in the
dataset and return its paired answer.

Usage:
    python train_model.py --data data/medquad.csv --out model
"""
import argparse
import os

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]

    # Try to auto-detect the question/answer columns regardless of the
    # exact names used by whichever dataset you downloaded.
    q_col = next((c for c in df.columns if 'question' in c), df.columns[0])
    a_col = next((c for c in df.columns if 'answer' in c), df.columns[1])

    df = df[[q_col, a_col]].dropna()
    df.columns = ['question', 'answer']
    df['question'] = df['question'].astype(str).str.strip()
    df['answer'] = df['answer'].astype(str).str.strip()
    df = df[(df['question'] != '') & (df['answer'] != '')]
    df = df.drop_duplicates(subset='question').reset_index(drop=True)
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', default='data/medquad.csv',
                         help='Path to CSV with question/answer columns')
    parser.add_argument('--out', default='model',
                         help='Directory to save the trained artifacts')
    args = parser.parse_args()

    print(f"Loading dataset from {args.data} ...")
    df = load_dataset(args.data)
    print(f"Loaded {len(df)} unique question-answer pairs")

    if len(df) < 20:
        print("⚠️  Warning: very small dataset. Results will be poor. "
              "Make sure your CSV actually contains many rows.")

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=30000,
        sublinear_tf=True,
    )
    question_vectors = vectorizer.fit_transform(df['question'])

    os.makedirs(args.out, exist_ok=True)
    joblib.dump(vectorizer, os.path.join(args.out, 'vectorizer.joblib'))
    joblib.dump(question_vectors, os.path.join(args.out, 'question_vectors.joblib'))
    df.to_pickle(os.path.join(args.out, 'qa_pairs.pkl'))

    print(f"✅ Model artifacts saved to ./{args.out}/")
    print("   - vectorizer.joblib")
    print("   - question_vectors.joblib")
    print("   - qa_pairs.pkl")


if __name__ == '__main__':
    main()
