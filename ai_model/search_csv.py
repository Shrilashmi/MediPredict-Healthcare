import pandas as pd

df = pd.read_csv("data/medquad.csv")

terms = [
    "wheezing",
    "whistling",
    "chest tightness",
    "stomach pain",
    "abdominal pain",
    "pain after eating",
    "fatigue",
    "tired",
    "headache",
    "frequent headache",
    "excessive thirst",
    "frequent urination",
    "diabetes"
]

print("ROWS:", len(df))

for term in terms:
    print("\n====================")
    print("SEARCH:", term)
    print("====================")

    matches = df[
        df["question"].str.contains(
            term,
            case=False,
            regex=False,
            na=False
        )
    ]["question"].head(10)

    print("FOUND:", len(matches))

    for question in matches:
        print(" ", question)