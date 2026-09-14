import pandas as pd

CSV_PATH = "data/medquad.csv"

df = pd.read_csv(CSV_PATH)

new_rows = []

def add_paraphrases(target_question, paraphrases):
    matches = df[
        df["question"].str.strip().str.lower()
        == target_question.strip().lower()
    ]

    if matches.empty:
        print("WARNING: Target question not found:", target_question)
        return

    source_row = matches.iloc[0]

    for question in paraphrases:
        new_rows.append({
            "question": question,
            "answer": source_row["answer"],
            "source": source_row["source"],
            "focus_area": source_row["focus_area"]
        })


# ---------------------------------------------------------
# ABDOMINAL / STOMACH PAIN
# ---------------------------------------------------------

add_paraphrases(
    "What is (are) Abdominal Pain ?",
    [
        "What causes stomach pain?",
        "Why does my stomach hurt?",
        "What can cause abdominal pain?",
        "Why do I have pain in my abdomen?",
        "What does stomach pain mean?",
        "I have stomach pain, what could cause it?",
        "I have abdominal pain, what could cause it?",
        "Why am I having stomach pain?",
        "What are common causes of stomach pain?",
        "What can cause pain in the stomach?"
    ]
)


# ---------------------------------------------------------
# FATIGUE
# ---------------------------------------------------------

add_paraphrases(
    "What is (are) Fatigue ?",
    [
        "Why am I feeling tired all the time?",
        "Why do I feel tired all the time?",
        "What causes constant tiredness?",
        "What causes extreme tiredness?",
        "Why do I always feel exhausted?",
        "What causes fatigue?",
        "Why am I constantly exhausted?",
        "What does feeling tired all the time mean?",
        "Why do I feel exhausted even after resting?",
        "What can cause long lasting tiredness?"
    ]
)


# ---------------------------------------------------------
# HEADACHE
# ---------------------------------------------------------

add_paraphrases(
    "What is (are) Headache ?",
    [
        "What causes headaches?",
        "What causes frequent headaches?",
        "Why do I keep getting headaches?",
        "Why am I having headaches often?",
        "What can cause a headache?",
        "Why does my head hurt?",
        "What are common causes of headaches?",
        "Why do I have frequent headaches?",
        "What does having frequent headaches mean?",
        "What can cause repeated headaches?"
    ]
)


# ---------------------------------------------------------
# DIABETES SYMPTOMS
# ---------------------------------------------------------

add_paraphrases(
    "What are the symptoms of Diabetes ?",
    [
        "What are the warning signs of diabetes?",
        "What are the early signs of diabetes?",
        "How can I tell if I have diabetes?",
        "What symptoms can diabetes cause?",
        "How do I know if I might have diabetes?",
        "What are common symptoms of diabetes?",
        "What are the signs of high blood sugar?",
        "Can frequent urination and thirst be signs of diabetes?",
        "Can being very thirsty be a sign of diabetes?",
        "Can feeling tired and urinating frequently be diabetes symptoms?"
    ]
)


# ---------------------------------------------------------
# URINE / URINATION
# ---------------------------------------------------------

add_paraphrases(
    "Do you have information about Urine and Urination",
    [
        "Why do I need to urinate frequently?",
        "Why am I urinating so often?",
        "Why do I keep needing to pee?",
        "What causes frequent urination?",
        "What can cause me to urinate often?",
        "Why do I need to go to the bathroom so often?",
        "Why am I peeing frequently?",
        "What does frequent urination mean?",
        "What can cause frequent trips to the bathroom?",
        "Why do I keep needing to use the bathroom?"
    ]
)


# ---------------------------------------------------------
# BREATHING PROBLEMS
# ---------------------------------------------------------

add_paraphrases(
    "What is (are) Breathing Problems ?",
    [
        "Why am I having trouble breathing?",
        "What causes difficulty breathing?",
        "Why do I feel short of breath?",
        "What can cause breathing problems?",
        "Why is it hard to breathe?",
        "What does shortness of breath mean?",
        "Why do I have trouble breathing?",
        "What can cause difficulty breathing?",
        "Why do I feel like I cannot get enough air?",
        "What are common causes of breathing problems?"
    ]
)


# ---------------------------------------------------------
# ADD NEW WHEEZING QUESTIONS
# ---------------------------------------------------------

wheezing_answer = (
    "Wheezing is a high-pitched whistling sound that can occur when "
    "breathing because air is moving through narrowed airways. It can "
    "occur with conditions such as asthma and other breathing problems. "
    "If wheezing is severe, sudden, or occurs with significant difficulty "
    "breathing, seek urgent medical attention."
)

for question in [
    "What is wheezing?",
    "What causes wheezing?",
    "Why do I hear a whistling sound when I breathe?",
    "Why do I hear a whistling sound while breathing?",
    "What does noisy breathing mean?",
    "Why am I wheezing?",
    "What causes a whistling sound when breathing?",
    "What can cause wheezing?",
]:
    new_rows.append({
        "question": question,
        "answer": wheezing_answer,
        "source": "MediPredict Clinical Extension",
        "focus_area": "Wheezing"
    })


# ---------------------------------------------------------
# ADD NEW CHEST TIGHTNESS QUESTIONS
# ---------------------------------------------------------

chest_tightness_answer = (
    "Chest tightness can have several possible causes, including "
    "breathing problems, muscle strain, anxiety, and heart or lung "
    "conditions. The cause cannot be determined from this symptom alone. "
    "Seek urgent medical attention if chest tightness is severe, sudden, "
    "or occurs with difficulty breathing, fainting, sweating, or pain "
    "spreading to the arm, jaw, neck, or back."
)

for question in [
    "What causes chest tightness?",
    "Why does my chest feel tight?",
    "Why does my chest feel like it is being squeezed?",
    "What does chest tightness mean?",
    "Why do I feel pressure or tightness in my chest?",
    "What can cause a squeezing feeling in the chest?",
    "Why does my chest feel squeezed?",
]:
    new_rows.append({
        "question": question,
        "answer": chest_tightness_answer,
        "source": "MediPredict Clinical Extension",
        "focus_area": "Chest Tightness"
    })


# ---------------------------------------------------------
# COMBINE AND REMOVE DUPLICATES
# ---------------------------------------------------------

new_df = pd.DataFrame(new_rows)

print("Existing rows:", len(df))
print("New rows created:", len(new_df))

combined = pd.concat([df, new_df], ignore_index=True)

combined["question_clean"] = (
    combined["question"]
    .astype(str)
    .str.strip()
    .str.lower()
)

before = len(combined)

combined = combined.drop_duplicates(
    subset="question_clean"
).drop(columns=["question_clean"])

after = len(combined)

print("Duplicates removed:", before - after)
print("Final rows:", after)

combined.to_csv(CSV_PATH, index=False)

print("\nCSV updated successfully.")
print("Backup remains available at:")
print("data/medquad_backup.csv")