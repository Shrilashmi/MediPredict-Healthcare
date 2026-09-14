
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
from sklearn.pipeline import FeatureUnion

import re


def normalize_clinical_text(text: str) -> str:
    """Preserve the original wording while adding useful clinical synonyms."""
    text = str(text).lower()

    additions = [
        (r'\bgoing to the bathroom\b', 'frequent urination'),
        (r'\busing the bathroom\b', 'frequent urination'),
        (r'\buse the bathroom\b', 'frequent urination'),
        (r'\burinating\b', 'urination'),
        (r'\burinate\b', 'urination'),
        (r'\burinates\b', 'urination'),
        (r'\burination\b', 'frequent urination'),
        (r'\bpee\b', 'urination'),
        (r'\bpeeing\b', 'urination'),

        (r'\bvery thirsty\b', 'excessive thirst'),
        (r'\bextremely thirsty\b', 'excessive thirst'),
        (r'\bconstant thirst\b', 'excessive thirst'),
        (r'\bconstantly thirsty\b', 'excessive thirst'),
        (r'\bfrequent thirst\b', 'excessive thirst'),

        (r'\bnoisy breathing\b', 'wheezing'),
        (r'\bwhistling sound when i breathe\b', 'wheezing'),
        (r'\bwhistling sound while breathing\b', 'wheezing'),
        (r'\bwhistling when breathing\b', 'wheezing'),
        (r'\bwhistling sound when breathing\b', 'wheezing'),

        (r'\bbreathing difficulty\b', 'difficulty breathing'),
        (r'\btrouble breathing\b', 'difficulty breathing'),
        (r'\bshortness of breath\b', 'difficulty breathing'),
        (r'\bhard to breathe\b', 'difficulty breathing'),
        (r'\bhard time breathing\b', 'difficulty breathing'),
        (r'\bcannot breathe well\b', 'difficulty breathing'),
        (r"\bcan't breathe well\b", 'difficulty breathing'),

        (r'\bchest is being squeezed\b', 'chest tightness'),
        (r'\bchest feels squeezed\b', 'chest tightness'),
        (r'\bchest feels like it is being squeezed\b', 'chest tightness'),
        (r'\bsqueezing feeling in my chest\b', 'chest tightness'),

        (r'\btrying to sleep\b', 'at night'),
        (r'\bwhen i am sleeping\b', 'at night'),

        (r'\bstomach ache\b', 'stomach pain'),
        (r'\bbelly pain\b', 'stomach pain'),
        (r'\bpain in my stomach\b', 'stomach pain'),

        (r'\bhead pain\b', 'headache'),
        (r'\bvery tired\b', 'fatigue'),
        (r'\bfeeling exhausted\b', 'fatigue'),
        (r'\bexhausted all the time\b', 'fatigue'),
    ]

    for pattern, synonym in additions:
        if re.search(pattern, text):
            text += ' ' + synonym

    return text

def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]

    # Try to auto-detect the question/answer columns regardless of the
    # exact names used by whichever dataset you downloaded.
    q_col = next(
        (c for c in df.columns if 'question' in c),
        df.columns[0]
    )
    a_col = next(
        (c for c in df.columns if 'answer' in c),
        df.columns[1]
    )

    df = df[[q_col, a_col]].dropna()
    df.columns = ['question', 'answer']

    df['question'] = df['question'].astype(str).str.strip()
    df['answer'] = df['answer'].astype(str).str.strip()

    df['question'] = df['question'].apply(normalize_clinical_text)

    df = df[
        (df['question'] != '') &
        (df['answer'] != '')
    ]

    df = df.drop_duplicates(
        subset='question'
    ).reset_index(drop=True)

    return df


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        '--data',
        default='data/medquad.csv',
        help='Path to CSV with question/answer columns'
    )

    parser.add_argument(
        '--out',
        default='model',
        help='Directory to save the trained artifacts'
    )

    args = parser.parse_args()

    print(f"Loading dataset from {args.data} ...")

    df = load_dataset(args.data)

    print(f"Loaded {len(df)} unique question-answer pairs")

    if len(df) < 20:
        print(
            "⚠️  Warning: very small dataset. Results will be poor. "
            "Make sure your CSV actually contains many rows."
        )

    # Combine word-level and character-level TF-IDF.
    #
    # Word TF-IDF:
    #   Good for understanding normal words and phrases.
    #
    # Character TF-IDF:
    #   Helps with paraphrasing, spelling differences, and similar word forms.
    #
    # This remains CPU-only and lightweight.
    vectorizer = FeatureUnion([
        (
            'word',
            TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 2),
                max_features=30000,
                sublinear_tf=True,
            )
        ),
        (
            'char',
            TfidfVectorizer(
                analyzer='char_wb',
                ngram_range=(3, 5),
                max_features=30000,
                sublinear_tf=True,
            )
        ),
    ])

    print("Training Word + Character TF-IDF model...")

    question_vectors = vectorizer.fit_transform(
        df['question']
    )

    os.makedirs(args.out, exist_ok=True)

    joblib.dump(
        vectorizer,
        os.path.join(args.out, 'vectorizer.joblib')
    )

    joblib.dump(
        question_vectors,
        os.path.join(args.out, 'question_vectors.joblib')
    )

    df.to_pickle(
        os.path.join(args.out, 'qa_pairs.pkl')
    )

    print(f"Model artifacts saved to ./{args.out}/")
    print("   - vectorizer.joblib")
    print("   - question_vectors.joblib")
    print("   - qa_pairs.pkl")


if __name__ == '__main__':
    main()

