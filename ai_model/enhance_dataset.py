import pandas as pd

DATA = r"./data/medquad_enhanced.csv"

df = pd.read_csv(DATA)

variants = {
    "Dizziness and Vertigo": [
        "Why does the room feel like it is spinning?",
        "Why do I suddenly feel like the room is spinning?",
        "I feel dizzy and like I might lose my balance. What could cause this?",
        "What can cause sudden dizziness?",
        "Why do I feel lightheaded when I stand up?",
        "I keep feeling dizzy. What could be the reason?",
        "Why do I feel like I am spinning or losing my balance?",
        "What are common reasons for feeling dizzy or having vertigo?"
    ],

    "Nausea and Vomiting": [
        "Why do I feel sick to my stomach?",
        "I feel like I am going to throw up. What could cause this?",
        "What can cause nausea and vomiting?",
        "Why do I suddenly feel nauseous?",
        "I feel nauseous and feel like vomiting. What could be wrong?",
        "What are common causes of feeling like throwing up?",
        "Why am I feeling sick and wanting to vomit?",
        "What can cause an upset stomach with vomiting?"
    ],

    "Headache": [
        "Why do I suddenly have a bad headache?",
        "What could be causing my headache?",
        "I have pressure in my head. What could be the reason?",
        "What are common reasons for getting headaches?",
        "Why does my head hurt so much?",
        "I keep getting headaches. What could cause them?",
        "What can cause pain in the head?",
        "When can a headache be a sign of something serious?",
	"I have a severe headache that started suddenly. What could cause it?",
        "I suddenly developed a very severe headache. What could be the reason?",
        "What could cause a sudden severe headache?",
        "When should a sudden headache be considered serious?",
        "I have a sudden bad headache. Should I be concerned?"
    ],

    "Chest Pain": [
        "I have pain in my chest. What could be causing it?",
        "Why am I feeling pressure in my chest?",
        "What could cause sudden chest pain?",
        "I feel pain or discomfort in my chest. What could it mean?",
        "What are common causes of chest pain?",
        "Why does my chest hurt?",
        "I have chest pressure and discomfort. What could cause this?",
        "What can cause pain around the chest area?"
    ],

        "Abdominal Pain": [
        "Why does my stomach hurt?",
        "What could be causing pain in my abdomen?",
        "I have stomach pain. What could be the reason?",
        "What are common causes of abdominal pain?",
        "Why am I having pain in my belly?",
        "I have pain in my abdomen. What could it mean?",
        "What can cause sudden stomach pain?",
        "Why does my belly hurt?",
	"I have severe stomach pain and vomiting. What could be causing it?",
        "What could cause severe abdominal pain along with vomiting?",
        "I have bad stomach pain and keep vomiting. What could be wrong?",
        "When is stomach pain with vomiting a serious concern?",
        "What should I do about severe abdominal pain and vomiting?"
    ],

    "Fever": [
        "Why do I have a fever?",
        "What can cause a fever?",
        "What are common causes of fever?",
        "Why is my body temperature higher than normal?",
        "I have a high temperature. What could be causing it?",
        "What does having a fever mean?",
        "Why am I running a temperature?",
        "What can make someone develop a fever?"
    ],

    "Fatigue": [
        "Why am I always feeling tired?",
        "What could be causing my tiredness?",
        "What are common causes of fatigue?",
        "Why do I feel exhausted even after sleeping?",
        "I feel tired all the time. What could be the reason?",
        "What can cause extreme tiredness?",
        "Why do I have very little energy?",
        "When can tiredness be a sign of a health problem?"
    ],
"Cough": [
        "Why am I coughing so much?",
        "What could be causing my cough?",
        "I have been coughing a lot. What could be the reason?",
        "What are common causes of coughing?",
        "Why do I keep coughing?",
        "I have a persistent cough. What could cause it?",
        "What can cause a cough that does not go away?",
        "Why have I suddenly started coughing?"
    ],

    "Back Pain": [
        "Why does my back hurt?",
        "What could be causing my back pain?",
        "I have pain in my back. What could be the reason?",
        "What are common causes of back pain?",
        "Why am I having lower back pain?",
        "What can cause sudden back pain?",
        "I keep getting back pain. What could cause it?",
        "When can back pain be a sign of a health problem?",
	 "My lower back has been hurting for several days. What could be causing it?",
        "I have had lower back pain for a few days. What could be the reason?",
        "Why has my lower back been hurting for several days?",
        "What could cause persistent lower back pain?",
        "When should I see a doctor for lower back pain?"
    ]
,
    "Asthma": [
        "What can trigger an asthma attack?",
        "What are common asthma triggers?",
        "What should I do if my asthma attack is severe?",
        "When can an asthma attack become an emergency?",
        "What are the warning signs of a serious asthma attack?"
    ],

    "Diabetes": [
        "I've been very thirsty and urinating a lot. Could this be diabetes?",
        "What are the warning signs of diabetes?",
        "What are early signs that someone may have diabetes?",
        "How can diabetes be diagnosed?",
        "What tests are used to diagnose diabetes?",
	"I have been extremely thirsty lately and drinking much more water than usual. Could this be diabetes?",
"I am constantly thirsty and using the bathroom much more often. Could these be signs of diabetes?",
"I keep needing to urinate frequently and I am unusually thirsty. What could be causing this?",
"I have been feeling very thirsty and tired recently. Could high blood sugar be the reason?",
"I am losing weight without trying and feel thirsty all the time. Could this be diabetes?",
"I have lost weight unexpectedly and I am urinating more than usual. Could I have diabetes?",
"I feel unusually tired, thirsty, and hungry lately. Could these symptoms be related to diabetes?",
"My vision has become blurry and I am also very thirsty. Could diabetes cause this?",
"I have a sore that is taking a long time to heal. Could this be related to diabetes?",
"I am extremely hungry and thirsty even though I am eating normally. Could this be a sign of diabetes?"
    ],

    "Chest Pain": [
        "I have chest pressure and I'm sweating. Could this be serious?",
        "Can chest pressure with sweating be a sign of a heart problem?",
        "What could cause chest pressure along with sweating?"
    ],

    "Pneumonia": [
        "I have a cough, fever and difficulty breathing. Could it be pneumonia?",
        "Could a cough with fever and breathing problems be pneumonia?",
        "What are signs of pneumonia when you have a cough and fever?",
        "Can pneumonia cause fever, cough and shortness of breath?"
    ]

}

new_rows = []

for focus, questions in variants.items():
    matches = df[df["focus_area"].astype(str).str.strip().str.lower() == focus.lower()]

    if matches.empty:
        print("WARNING: No matching focus area:", focus)
        continue

    # Use the existing authoritative answer for this focus area.
    base = matches.iloc[0]

    for question in questions:
        new_rows.append({
            "question": question,
            "answer": base["answer"],
            "source": base["source"],
            "focus_area": base["focus_area"]
        })

new_df = pd.DataFrame(new_rows)

# Avoid adding anything that already exists.
existing_questions = set(df["question"].astype(str).str.strip().str.lower())
new_df = new_df[
    ~new_df["question"].astype(str).str.strip().str.lower().isin(existing_questions)
]

result = pd.concat([df, new_df], ignore_index=True)

result.to_csv(DATA, index=False)

print("Original rows:", len(df))
print("New questions added:", len(new_df))
print("Final rows:", len(result))
print("Final unique questions:", result["question"].nunique())
print("Enhanced dataset saved:", DATA)

