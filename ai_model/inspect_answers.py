import pandas as pd

df = pd.read_csv("data/medquad.csv")

terms = [
    "Abdominal Pain",
    "Fatigue",
    "Headache",
    "Diabetes",
    "Urine",
    "Breathing"
]

for term in terms:
    print("\n" + "=" * 70)
    print("TOPIC:", term)
    print("=" * 70)

    matches = df[
        df["question"].str.contains(
            term,
            case=False,
            regex=False,
            na=False
        )
    ]

    for _, row in matches.head(5).iterrows():
        print("\nQUESTION:", row["question"])
        print("ANSWER:", str(row["answer"])[:1000])
        print("SOURCE:", row["source"])
        print("FOCUS:", row["focus_area"])