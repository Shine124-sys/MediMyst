"use client";
import React, {useEffect, useState } from 'react';
import { AlertCircle, Search, Pill, User, Calendar } from 'lucide-react';
export default function MedicineRecommender() {
  const [symptoms, setSymptoms] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(20px, -50px) scale(1.1); }
        50% { transform: translate(-20px, 20px) scale(0.9); }
        75% { transform: translate(50px, 50px) scale(1.05); }
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes slide-down {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes slide-right {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }

      .animate-blob { animation: blob 7s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }
      .animate-fade-in { animation: fade-in 0.6s ease-out; }
      .animate-slide-up { animation: slide-up 0.6s ease-out; }
      .animate-slide-down { animation: slide-down 0.6s ease-out; }
      .animate-slide-right { animation: slide-right 0.6s ease-out; }
      .animate-shake { animation: shake 0.5s ease-out; }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  interface Recommendation {
  name: string;
  confidence?: string;
  disease: string;
  symptoms: string;
  causes?: string;
  dosage: string;
  precautions: string;
  genderWarning?: string;
}
interface HomeRemedy {
  remedy: string;
  description: string;
  icon: string;
}
  const [recommendations,setRecommendations]=useState<Recommendation[]>([]);
  const [homeRemedySuggestions, setHomeRemedySuggestions] = useState<HomeRemedy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
interface MedicalData {
  //name?:string;
  gender: string;
  symptoms: string;
  causes: string;
 // dosage?:string;
 // precautions?:string;
  disease: string;
  medicine: string;
  //genderWarning?:string;
}
interface Remedy {
  name: string;
  dosage: string;
  precautions: string;
  ageAppropriate: boolean;
  genderWarning: boolean;
}
  const [allRemedies, setAllRemedies] = useState<Remedy[]>([]);
  const [medicalData, setMedicalData] = useState<MedicalData[]| null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [modelStatus, setModelStatus] = useState('Initializing...');
  
  // Load and parse CSV file
  useEffect(()=>{
  const loadCSVData = async () => {
  try {
    setModelStatus('Loading medical database...');

    const response = await fetch("/medicalrecords.csv");
    const csvContent = await response.text();

    const lines = csvContent.split("\n");
    const data: MedicalData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",");
        const clean = values.map(v => v.replace(/"/g, "").trim());

        const row: MedicalData = {
          gender: clean[0],
          symptoms: clean[1],
          causes: clean[2],
          disease: clean[3],
          medicine: clean[4]
        };

        data.push(row);
      }
    }

    setMedicalData(data);
    setDataLoaded(true);
    setModelStatus(`AI Model ready with ${data.length} medical records`);

  } catch (error) {
    console.error("CSV Load Error:", error);
    setError("Failed to load medical database.");
  }
};

loadCSVData();
  },[]);
  
  const getAIRecommendations = async (
    userSymptoms:string
    , userGender:string, 
    userAge:string) => {
    try {
      if(!medicalData)return[];
     
      const trainingContext = medicalData
        .filter(record => {
          const genderMatch = record.gender.toLowerCase().startsWith(userGender.toLowerCase().charAt(0));
          return genderMatch;
        })
        .slice(0, 50) // ⬅️ CHANGE THIS NUMBER to increase training data
        .map(record => `Gender: ${record.gender}, Symptoms: ${record.symptoms}, Disease: ${record.disease}, Medicine: ${record.medicine}`)
        .join('\n');

      const prompt = `You are a medical AI assistant trained on a database of medical records. Analyze the patient's symptoms and provide medicine recommendations.

MEDICAL RECORDS DATABASE (Training Data):
${trainingContext}

PATIENT INFORMATION:
- Gender: ${userGender}
- Age: ${userAge} years
- Symptoms: ${userSymptoms}

ANALYSIS INSTRUCTIONS:
- Consider the patient's age when recommending dosages
- Match symptoms precisely with the training data
- Prioritize evidence-based recommendations from the database
- Include confidence levels (high/medium/low) for each recommendation
- Consider potential drug interactions and contraindications

⬇️ ADD MORE INSTRUCTIONS HERE TO IMPROVE AI PERFORMANCE ⬇️
Example additions:
- Factor in severity of symptoms
- Consider allergies and pre-existing conditions
- Include alternative treatments
- Provide time-to-effect estimates

Based on the medical records above and the patient's information, provide medicine recommendations in the following JSON format ONLY (no other text):

[
  {
    "name": "Medicine name",
    "disease": "Likely disease/condition",
    "symptoms": "Matching symptoms from database",
    "causes": "Possible causes",
    "dosage": "Age-appropriate dosage instructions",
    "precautions": "Important precautions and warnings",
    "confidence": "high/medium/low"
  }
]

Provide 2-4 most relevant recommendations based on the training data. Consider the patient's age for dosage safety.`;

      // 🔧 ENHANCEMENT POINT 3: Adjust API parameters
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", // ⬅️ Can upgrade to Opus for better performance
          max_tokens: 2000, // ⬅️ INCREASE THIS (e.g., 4000) for more detailed responses
          // temperature: 0.3, // ⬅️ UNCOMMENT & ADJUST (0.0-1.0) for consistency control
          // top_p: 0.9, // ⬅️ ADD THIS for diversity control
          messages: [
            // 🔧 ENHANCEMENT POINT 4: Add system message
            // {
            //   role: "system",
            //   content: "You are an expert medical AI assistant with deep knowledge of pharmacology and diagnostics."
            // },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      
      // Extract text from response
      let responseText = '';
      if (data.content) {
        for (const block of data.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
      }

      // 🔧 ENHANCEMENT POINT 5: Add response validation
      // Parse JSON recommendations
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          
          // ⬇️ ADD VALIDATION HERE ⬇️
          // Example: Check if recommended medicines exist in database
          // const validatedRecs = recommendations.filter(rec => 
          //   medicalData.some(record => 
          //     record.medicine.toLowerCase().includes(rec.name.toLowerCase())
          //   )
          // );
          interface Recommendation {
  name: string;
  [key: string]: unknown; // fallback for extra fields you spread
}

          return recommendations.map((rec : Recommendation) => ({
            ...rec,
            ageAppropriate: true,
            genderWarning: getGenderWarning(rec.name, userGender)
          }));
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }

      // Fallback to CSV-based matching if AI parsing fails
      return findMatchingMedicines(userSymptoms, userGender, userAge);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      // Fallback to CSV-based matching
      return findMatchingMedicines(userSymptoms, userGender, userAge);
    }
  };

 
interface HomeRemedy {
  remedy: string;
  description: string;
}

  const homeRemedies : Record<string,HomeRemedy[]> = {
    'depression': [
  { remedy: 'Sunlight Exposure', description: 'Spend at least 15 minutes in sunlight daily to boost mood.', icon: '☀️' },
  { remedy: 'Physical Activity', description: 'Engage in regular exercise to release endorphins and improve mood.', icon: '🏋️' },
  { remedy: 'Social Connection', description: 'Talk to friends or family to reduce feelings of isolation.', icon: '👥' }
],

'insomnia': [
  { remedy: 'Sleep Routine', description: 'Go to bed and wake up at the same time every day.', icon: '🛏️' },
  { remedy: 'Avoid Screens', description: 'Limit screen time 1 hour before bedtime.', icon: '📵' },
  { remedy: 'Herbal Tea', description: 'Drink chamomile or valerian root tea to relax before sleep.', icon: '🫖' }
],

'hypertension': [
  { remedy: 'Reduce Salt Intake', description: 'Limit salt in meals to help control blood pressure.', icon: '🧂' },
  { remedy: 'Exercise Regularly', description: 'Engage in moderate aerobic exercise most days of the week.', icon: '🏃' },
  { remedy: 'Stress Management', description: 'Practice yoga or meditation to reduce stress levels.', icon: '🧘' }
],

'hypotension': [
  { remedy: 'Increase Fluid Intake', description: 'Drink plenty of water to maintain blood volume.', icon: '💧' },
  { remedy: 'Small Frequent Meals', description: 'Eat small meals throughout the day to prevent drops in blood pressure.', icon: '🍽️' },
  { remedy: 'Leg Elevation', description: 'Elevate legs when resting to improve circulation.', icon: '🦵' }
],

'constipation': [
  { remedy: 'High-Fiber Foods', description: 'Eat fruits, vegetables, and whole grains to improve bowel movements.', icon: '🍎' },
  { remedy: 'Hydration', description: 'Drink plenty of water to soften stools.', icon: '💧' },
  { remedy: 'Exercise', description: 'Regular physical activity can help stimulate bowel movements.', icon: '🏃' }
],

'diarrhea': [
  { remedy: 'Oral Rehydration', description: 'Drink ORS or clear fluids to prevent dehydration.', icon: '💧' },
  { remedy: 'Bananas', description: 'Eat bananas to restore potassium and electrolytes.', icon: '🍌' },
  { remedy: 'Avoid Dairy', description: 'Avoid milk and dairy products until recovery.', icon: '🥛' }
],

'migraine': [
  { remedy: 'Dark Room Rest', description: 'Rest in a dark, quiet room during migraine episodes.', icon: '🛏️' },
  { remedy: 'Cold Compress', description: 'Apply a cold pack to forehead or neck to reduce pain.', icon: '🧊' },
  { remedy: 'Hydration', description: 'Drink water regularly to avoid dehydration triggers.', icon: '💧' }
],

'allergy': [
  { remedy: 'Saline Nasal Rinse', description: 'Use saline solution to flush allergens from nasal passages.', icon: '💧' },
  { remedy: 'Local Honey', description: 'Consume local honey to build tolerance to pollen.', icon: '🍯' },
  { remedy: 'Green Tea', description: 'Drink green tea for its natural antihistamine properties.', icon: '🍵' }
],

'nausea': [
  { remedy: 'Ginger', description: 'Chew fresh ginger or drink ginger tea to calm stomach.', icon: '🫖' },
  { remedy: 'Lemon', description: 'Smell or sip lemon water to reduce nausea.', icon: '🍋' },
  { remedy: 'Fresh Air', description: 'Sit in a well-ventilated area or near an open window.', icon: '🌬️' }
],

'cold': [
  { remedy: 'Steam Inhalation', description: 'Inhale steam to ease congestion.', icon: '♨️' },
  { remedy: 'Honey & Lemon', description: 'Drink warm honey and lemon water to soothe throat.', icon: '🍯' },
  { remedy: 'Rest', description: 'Get adequate sleep to help your immune system.', icon: '😴' }
],

 
  'headache': [
    { remedy: 'Cold/Warm Compress', description: 'Apply a cold compress to your forehead or a warm compress to the back of your neck.', icon: '🧊' },
    { remedy: 'Stay Hydrated', description: 'Dehydration can cause headaches. Drink 8-10 glasses of water throughout the day.', icon: '💧' },
    { remedy: 'Ginger Tea', description: 'Drink ginger tea to reduce inflammation and provide natural pain relief.', icon: '🫖' },
    { remedy: 'Peppermint Oil', description: 'Apply diluted peppermint oil to temples for a cooling, soothing effect.', icon: '🌿' }
  ],
  'cold': [
    { remedy: 'Honey & Lemon', description: 'Mix honey and lemon in warm water. Soothes throat and boosts immunity.', icon: '🍯' },
    { remedy: 'Steam Inhalation', description: 'Inhale steam from hot water to clear nasal passages and ease congestion.', icon: '♨️' },
    { remedy: 'Vitamin C', description: 'Eat citrus fruits, berries, and bell peppers to boost your immune system.', icon: '🍊' },
    { remedy: 'Garlic', description: 'Consume raw or cooked garlic for its natural antiviral and antibacterial properties.', icon: '🧄' }
  ],
  'cough': [
    { remedy: 'Honey', description: 'Take a spoonful of honey to coat and soothe your throat naturally.', icon: '🍯' },
    { remedy: 'Ginger Tea', description: 'Drink warm ginger tea to reduce inflammation and ease coughing.', icon: '🫖' },
    { remedy: 'Turmeric Milk', description: 'Mix turmeric powder in warm milk for its anti-inflammatory properties.', icon: '🥛' }
  ],
  'stomach pain': [
    { remedy: 'Ginger', description: 'Chew fresh ginger or drink ginger tea to ease nausea and stomach discomfort.', icon: '🫖' },
    { remedy: 'Peppermint Tea', description: 'Drink peppermint tea to relax stomach muscles and reduce pain.', icon: '🌿' },
    { remedy: 'BRAT Diet', description: 'Eat bananas, rice, applesauce, and toast for easy digestion.', icon: '🍌' },
    { remedy: 'Warm Water', description: 'Sip warm water to aid digestion and provide comfort.', icon: '💧' }
  ],
  'allergy': [
    { remedy: 'Saline Rinse', description: 'Use a saline nasal rinse to clear allergens from nasal passages.', icon: '💧' },
    { remedy: 'Local Honey', description: 'Consume local honey daily to build tolerance to local pollen.', icon: '🍯' },
    { remedy: 'Green Tea', description: 'Drink green tea for its natural antihistamine properties.', icon: '🍵' }
  ],
 
  'vomiting': [
    { remedy: 'ORS', description: 'Drink Oral Rehydration Solution frequently in small sips to prevent dehydration.', icon: '💧' },
    { remedy: 'Ginger Tea', description: 'Sip ginger tea to reduce nausea and vomiting.', icon: '🫖' },
    { remedy: 'Rest', description: 'Lie down and rest to help your body recover.', icon: '😴' }
  ],
  
  'fatigue': [
    { remedy: 'Rest', description: 'Get adequate sleep and take short naps if needed.', icon: '😴' },
    { remedy: 'Balanced Diet', description: 'Eat nutrient-rich foods including fruits and vegetables.', icon: '🥗' },
    { remedy: 'Hydration', description: 'Drink enough water throughout the day.', icon: '💧' }
  ],
  'sore throat': [
    { remedy: 'Salt Water Gargle', description: 'Gargle warm salt water 2-3 times a day to soothe throat.', icon: '🧂' },
    { remedy: 'Honey', description: 'Take honey to coat and soothe your throat.', icon: '🍯' },
    { remedy: 'Herbal Tea', description: 'Drink warm herbal teas like chamomile to reduce discomfort.', icon: '🫖' }
  ],
  'back pain': [
    { remedy: 'Stretching', description: 'Gentle stretching exercises can relieve tension.', icon: '🤸' },
    { remedy: 'Heat Therapy', description: 'Apply warm compress or heating pad to sore muscles.', icon: '🔥' },
    { remedy: 'Rest', description: 'Avoid heavy lifting and rest the affected area.', icon: '😴' }
  ],
  'joint pain': [
    { remedy: 'Warm Compress', description: 'Apply a warm compress to affected joints to reduce stiffness.', icon: '🔥' },
    { remedy: 'Gentle Exercise', description: 'Low-impact activities like walking or swimming help improve mobility.', icon: '🏊' },
    { remedy: 'Turmeric', description: 'Include turmeric in diet for anti-inflammatory effects.', icon: '🌿' }
  ],
  'dizziness': [
    { remedy: 'Sit or Lie Down', description: 'Prevent falls by sitting or lying down immediately.', icon: '🪑' },
    { remedy: 'Hydration', description: 'Drink water to prevent dehydration-related dizziness.', icon: '💧' },
    { remedy: 'Deep Breathing', description: 'Take slow deep breaths to stabilize blood pressure.', icon: '🧘' }
  ],
 


// ===================== TOTAL =====================
// Currently we have 25+ symptoms, each with 3+ remedies → ~75 entries
// You can replicate this pattern with:
// 'acidity', 'gas', 'bloating', 'menstrual cramps', 'earache', 'eye strain', 
// 'cold feet', 'muscle cramps', 'motion sickness', 'hangover', 'skin irritation', 
// 'sunburn', 'bug bite', 'dry cough', 'sinus congestion', 'nosebleed', etc. 
// to easily reach 200+ remedies.

    'fever': [
      { 
        remedy: 'Stay Hydrated',
        description: 'Drink plenty of water, herbal teas, and clear broths to prevent dehydration.',
        icon: '💧'
      },
      { 
        remedy: 'Cool Compress',
        description: 'Apply a cool, damp washcloth to your forehead and wrists to help reduce temperature.',
        icon: '🧊'
      },
      { 
        remedy: 'Rest',
        description: 'Get plenty of sleep and avoid strenuous activities to help your body recover.',
        icon: '😴'
      }
    ],
    'headache': [
      { 
        remedy: 'Cold/Warm Compress',
        description: 'Apply a cold compress to your forehead or a warm compress to the back of your neck.',
        icon: '🧊'
      },
      { 
        remedy: 'Stay Hydrated',
        description: 'Dehydration can cause headaches. Drink 8-10 glasses of water throughout the day.',
        icon: '💧'
      },
      { 
        remedy: 'Ginger Tea',
        description: 'Drink ginger tea to reduce inflammation and provide natural pain relief.',
        icon: '🫖'
      },
      { 
        remedy: 'Peppermint Oil',
        description: 'Apply diluted peppermint oil to temples for a cooling, soothing effect.',
        icon: '🌿'
      }
    ],
    'cold': [
      { 
        remedy: 'Honey & Lemon',
        description: 'Mix honey and lemon in warm water. Soothes throat and boosts immunity.',
        icon: '🍯'
      },
      { 
        remedy: 'Steam Inhalation',
        description: 'Inhale steam from hot water to clear nasal passages and ease congestion.',
        icon: '♨️'
      },
      { 
        remedy: 'Vitamin C',
        description: 'Eat citrus fruits, berries, and bell peppers to boost your immune system.',
        icon: '🍊'
      },
      { 
        remedy: 'Garlic',
        description: 'Consume raw or cooked garlic for its natural antiviral and antibacterial properties.',
        icon: '🧄'
      }
    ],
    'cough': [
      { 
        remedy: 'Honey',
        description: 'Take a spoonful of honey to coat and soothe your throat naturally.',
        icon: '🍯'
      },
      { 
        remedy: 'Ginger Tea',
        description: 'Drink warm ginger tea to reduce inflammation and ease coughing.',
        icon: '🫖'
      },
      { 
        remedy: 'Turmeric Milk',
        description: 'Mix turmeric powder in warm milk for its anti-inflammatory properties.',
        icon: '🥛'
      }
    ],
    'stomach pain': [
      { 
        remedy: 'Ginger',
        description: 'Chew fresh ginger or drink ginger tea to ease nausea and stomach discomfort.',
        icon: '🫖'
      },
      { 
        remedy: 'Peppermint Tea',
        description: 'Drink peppermint tea to relax stomach muscles and reduce pain.',
        icon: '🌿'
      },
      { 
        remedy: 'BRAT Diet',
        description: 'Eat bananas, rice, applesauce, and toast for easy digestion.',
        icon: '🍌'
      },
      { 
        remedy: 'Warm Water',
        description: 'Sip warm water to aid digestion and provide comfort.',
        icon: '💧'
      }
    ],
    'allergy': [
      { 
        remedy: 'Saline Rinse',
        description: 'Use a saline nasal rinse to clear allergens from nasal passages.',
        icon: '💧'
      },
      { 
        remedy: 'Local Honey',
        description: 'Consume local honey daily to build tolerance to local pollen.',
        icon: '🍯'
      },
      { 
        remedy: 'Green Tea',
        description: 'Drink green tea for its natural antihistamine properties.',
        icon: '🍵'
      }
    ],
    'nausea': [
      { 
        remedy: 'Ginger',
        description: 'Chew fresh ginger or drink ginger ale to settle your stomach.',
        icon: '🫖'
      },
      { 
        remedy: 'Lemon',
        description: 'Smell fresh lemon or drink lemon water to reduce nausea.',
        icon: '🍋'
      },
      { 
        remedy: 'Deep Breathing',
        description: 'Practice slow, deep breathing exercises to calm your stomach.',
        icon: '🧘'
      }
    ]
  };
  const data = {
  'fever': [
    {
      name: "Paracetamol",
      dosage: "Adults: 500–1000mg every 4–6 hours\nChildren (6–12 yrs): Adjust dose",
      precautions: "Do not exceed 4000mg per day. Avoid alcohol.",
      ageRestriction: { min: 6, max: 100 },
      genderNote: null
    },
    {
      name: "Ibuprofen",
      dosage: "Adults: 200–400mg every 4–6 hours",
      precautions: "Avoid if history of ulcers or kidney disease.",
      ageRestriction: { min: 12, max: 100 },
      genderNote: null
    }
  ],
    'headache': [
      { 
        name: 'Aspirin', 
        dosage: 'Adults: 300-900mg every 4-6 hours\nNot for children under 16',
        precautions: 'Take with food. Not for children under 16.',
        ageRestriction: { min: 16, max: 100 },
        genderNote: null
      },
      { 
        name: 'Paracetamol', 
        dosage: 'Adults: 500-1000mg every 4-6 hours\nChildren (6-12 yrs): 250-500mg every 4-6 hours',
        precautions: 'Do not exceed 4000mg per day.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      }
    ],
    'cold': [
      { 
        name: 'Cetirizine', 
        dosage: 'Adults & Children (6+ yrs): 10mg once daily',
        precautions: 'May cause drowsiness.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      },
      { 
        name: 'Phenylephrine', 
        dosage: 'Adults: 10mg every 4 hours\nChildren (6-12 yrs): 5mg every 4 hours',
        precautions: 'Avoid if you have high blood pressure.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      }
    ],
    'cough': [
      { 
        name: 'Dextromethorphan', 
        dosage: 'Adults: 15-30mg every 4-6 hours\nChildren (6-12 yrs): 5-10mg every 4 hours',
        precautions: 'Do not exceed recommended dose.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      }
    ],
    'stomach pain': [
      { 
        name: 'Omeprazole', 
        dosage: 'Adults: 20mg once daily\nNot recommended for children without prescription',
        precautions: 'Take before meals.',
        ageRestriction: { min: 18, max: 100 },
        genderNote: null
      },
      { 
        name: 'Antacid', 
        dosage: 'Adults & Children (12+ yrs): 1-2 tablets as needed',
        precautions: 'Take between meals.',
        ageRestriction: { min: 12, max: 100 },
        genderNote: null
      }
    ],
    'diarrhea': [
      { 
        name: 'Loperamide', 
        dosage: 'Adults: 4mg initially, then 2mg after each loose stool\nChildren (6-12 yrs): Consult doctor',
        precautions: 'Stay hydrated. Consult doctor if symptoms persist.',
        ageRestriction: { min: 12, max: 100 },
        genderNote: null
      }
    ],
    'allergy': [
      { 
        name: 'Cetirizine', 
        dosage: 'Adults & Children (6+ yrs): 10mg once daily',
        precautions: 'May cause drowsiness.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      },
      { 
        name: 'Loratadine', 
        dosage: 'Adults & Children (6+ yrs): 10mg once daily',
        precautions: 'Non-drowsy formula.',
        ageRestriction: { min: 6, max: 100 },
        genderNote: null
      }
    ],
    'nausea': [
      { 
        name: 'Domperidone', 
        dosage: 'Adults: 10mg three times daily\nChildren: Consult doctor',
        precautions: 'Take before meals.',
        ageRestriction: { min: 18, max: 100 },
        genderNote: 'Pregnant women should consult doctor'
      }
    ],
    'sore throat': [
  {
    name: "Lozenges (e.g., Strepsils)",
    dosage: "Adults & Children (6+ yrs): 1 lozenge every 2–3 hours",
    precautions: "Do not exceed recommended limit. Avoid hot drinks immediately after use.",
    ageRestriction: { min: 6, max: 100 },
    genderNote: null
  },
  {
    name: "Salt Water Gargle",
    dosage: "Gargle warm salt water 2–3 times a day",
    precautions: "Do not swallow the solution.",
    ageRestriction: { min: 5, max: 100 },
    genderNote: null
  }
],

'body pain': [
  {
    name: "Ibuprofen",
    dosage: "Adults: 200–400mg every 4–6 hours",
    precautions: "Avoid if you have ulcers, kidney disease, or stomach issues.",
    ageRestriction: { min: 12, max: 100 },
    genderNote: null
  },
  {
    name: "Paracetamol",
    dosage: "Adults: 500–1000mg every 4–6 hours",
    precautions: "Do not exceed 4000mg/day.",
    ageRestriction: { min: 6, max: 100 },
    genderNote: null
  }
],

'acidity': [
  {
    name: "Pantoprazole",
    dosage: "Adults: 40mg once daily",
    precautions: "Take before food. Not recommended for long-term without doctor's advice.",
    ageRestriction: { min: 18, max: 100 },
    genderNote: null
  },
  {
    name: "Antacid Gel",
    dosage: "Adults: 1–2 teaspoons after meals",
    precautions: "Avoid overuse if you have kidney issues.",
    ageRestriction: { min: 12, max: 100 },
    genderNote: null
  }
],

'gas / bloating': [
  {
    name: "Simethicone",
    dosage: "Adults: 40–80mg after meals",
    precautions: "Safe for most adults but do not exceed recommended dose.",
    ageRestriction: { min: 6, max: 100 },
    genderNote: null
  },
  {
    name: "Activated Charcoal",
    dosage: "Adults: 260–520mg as needed",
    precautions: "May reduce absorption of medicines. Take 2 hours apart from other drugs.",
    ageRestriction: { min: 12, max: 100 },
    genderNote: null
  }
],

'vomiting': [
  {
    name: "ORS (Oral Rehydration Solution)",
    dosage: "Sip small amounts frequently until hydrated",
    precautions: "Use only WHO-approved ORS packets.",
    ageRestriction: { min: 0, max: 100 },
    genderNote: null
  },
  {
    name: "Doxylamine + Pyridoxine",
    dosage: "Adults: 1 tablet at bedtime; max 4 tablets/day",
    precautions: "May cause drowsiness.",
    ageRestriction: { min: 18, max: 100 },
    genderNote: "Pregnant women commonly use but consult doctor first"
  }
],

'constipation': [
  {
    name: "Isabgol (Psyllium Husk)",
    dosage: "Adults: 1–2 teaspoons with warm water at night",
    precautions: "Drink plenty of water.",
    ageRestriction: { min: 10, max: 100 },
    genderNote: null
  },
  {
    name: "Lactulose",
    dosage: "Adults: 15–30ml once daily",
    precautions: "May cause gas initially.",
    ageRestriction: { min: 12, max: 100 },
    genderNote: null
  }
],

'mild skin rash': [
  {
    name: "Calamine Lotion",
    dosage: "Apply 1–2 times daily on affected area",
    precautions: "Avoid over broken skin.",
    ageRestriction: { min: 2, max: 100 },
    genderNote: null
  },
  {
    name: "Cetirizine",
    dosage: "Adults & Children (6+ yrs): 10mg once daily",
    precautions: "May cause mild drowsiness.",
    ageRestriction: { min: 6, max: 100 },
    genderNote: null
  }
],

'back pain': [
  {
    name: "Ibuprofen",
    dosage: "Adults: 200–400mg every 4–6 hours",
    precautions: "Avoid if you have kidney problems or ulcers.",
    ageRestriction: { min: 18, max: 100 },
    genderNote: null
  },
  {
    name: "Topical Pain Relief Gel",
    dosage: "Apply thin layer 2–3 times daily",
    precautions: "Avoid on open wounds.",
    ageRestriction: { min: 12, max: 100 },
    genderNote: null
  }
]

};


  const fetchHomeRemediesFromWeb = async (symptom:string) => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Search the web for natural home remedies for ${symptom}. Provide 4-5 practical, safe home remedies with brief descriptions. Format as JSON array with structure: [{"remedy": "name", "description": "how to use", "icon": "emoji"}]. Only return the JSON array, no other text.`
            }
          ],
          tools: [
            {
              "type": "web_search_20250305",
              "name": "web_search"
            }
          ]
        })
      });

      const data = await response.json();
      
      // Extract text from response
      let remediesText = '';
      if (data.content) {
        for (const block of data.content) {
          if (block.type === 'text') {
            remediesText += block.text;
          }
        }
      }
      
      // Try to parse JSON from the response
      try {
        // Remove markdown code blocks if present
        const jsonMatch = remediesText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const remedies = JSON.parse(jsonMatch[0]);
          return remedies.map((remedy:Remedy) => ({
            ...remedy,
            symptom: symptom
          }));
        }
      } catch (parseError) {
        console.error('Error parsing remedies:', parseError);
      }

      // Fallback to default remedies if parsing fails
      return homeRemedies[symptom] || [];
    } catch (error) {
      console.error('Error fetching remedies:', error);
      return homeRemedies[symptom] || [];
    }
  };

  const findMatchingMedicines = (userSymptoms:string, userGender:string, userAge:string) => {
    if (!medicalData || medicalData.length === 0) {
      return [];
    }

    const normalizedSymptoms = userSymptoms.toLowerCase().trim();
    const normalizedGender = userGender.toLowerCase();
    
    const matches = [];
    const seenMedicines = new Set();

    for (const record of medicalData) {
      // Clean and normalize gender
      const recordGender = record.gender.toLowerCase().replace(/\s+/g, '').trim();
      if (!recordGender.startsWith(normalizedGender.charAt(0))) {
        continue; // Skip if gender doesn't match
      }

      // Check if any symptom matches
      const recordSymptoms = record.symptoms.toLowerCase();
      const symptomWords = normalizedSymptoms.split(/[\s,]+/).filter(w => w.length > 3);
      
      let hasMatch = false;
      for (const word of symptomWords) {
        if (recordSymptoms.includes(word)) {
          hasMatch = true;
          break;
        }
      }

      if (hasMatch && record.medicine && !seenMedicines.has(record.medicine)) {
        seenMedicines.add(record.medicine);
        
        matches.push({
          name: record.medicine,
          disease: record.disease || 'General condition',
          symptoms: record.symptoms,
          causes: record.causes || 'Various causes',
          dosage: getDosageInfo(record.medicine, Number(userAge)),
          precautions: getPrecautions(record.medicine),
          ageAppropriate: true,
          genderWarning: getGenderWarning(record.medicine, userGender)
        });
      }
    }

    return matches;
  };

  const getDosageInfo = (medicine:string, age:number) => {
    const ageNum = parseInt(age.toString());
    
    // Default dosage information based on medicine type
    const dosageMap: Record<string, string> = {
  // ================= PAIN RELIEVERS =================
  'ibuprofen': ageNum < 12 ? 'Children (6-12 yrs): 200mg every 6-8 hours\nNot for children under 6' : 'Adults: 400-600mg every 6-8 hours\nMax 2400mg per day',
  'paracetamol': ageNum < 12 ? 'Children (6-12 yrs): 250-500mg every 4-6 hours' : 'Adults: 500-1000mg every 4-6 hours\nMax 4000mg per day',
  'acetaminophen': ageNum < 12 ? 'Children (6-12 yrs): 10-15mg/kg every 4-6 hours' : 'Adults: 325-650mg every 4-6 hours',
  'aspirin': ageNum < 16 ? 'Not recommended for children under 16 due to Reye’s syndrome' : 'Adults: 300-900mg every 4-6 hours\nMax 4g/day',
  'naproxen': ageNum < 12 ? 'Children: Consult pediatrician' : 'Adults: 250-500mg every 12 hours\nMax 1250mg/day',
  'diclofenac': ageNum < 12 ? 'Children: Consult doctor' : 'Adults: 50mg 2-3 times/day\nMax 150mg/day',
  'celecoxib': ageNum < 18 ? 'Not recommended for children' : 'Adults: 100-200mg twice daily\nAs prescribed',
  'meloxicam': ageNum < 12 ? 'Consult pediatrician' : 'Adults: 7.5-15mg once daily',
  'tramadol': ageNum < 12 ? 'Not recommended for children under 12' : 'Adults: 50-100mg every 4-6 hours\nMax 400mg/day',
  'codeine': ageNum < 12 ? 'Avoid in children under 12' : 'Adults: 15-60mg every 4-6 hours\nMax 240mg/day',

  // ================= ANTIBIOTICS =================
  'amoxicillin': ageNum < 12 ? 'Children: 20-40mg/kg/day divided every 8 hours' : 'Adults: 500mg every 8 hours or 875mg every 12 hours',
  'azithromycin': ageNum < 12 ? 'Children: 10mg/kg on day 1, then 5mg/kg/day for 4 days' : 'Adults: 500mg on day 1, then 250mg/day for 4 days',
  'penicillin': ageNum < 12 ? 'Children: 250-500mg every 6-8 hours' : 'Adults: 500mg every 6-8 hours',
  'ciprofloxacin': ageNum < 18 ? 'Not recommended in children unless necessary' : 'Adults: 500mg every 12 hours',
  'doxycycline': ageNum < 8 ? 'Not for children under 8' : 'Adults: 100mg twice daily',
  'cephalexin': ageNum < 12 ? 'Children: 25-50mg/kg/day divided every 6-12 hours' : 'Adults: 500mg every 12 hours',
  'clindamycin': ageNum < 12 ? 'Children: 8-25mg/kg/day divided every 8 hours' : 'Adults: 150-450mg every 6-8 hours',
  'metronidazole': ageNum < 12 ? 'Children: 30mg/kg/day divided every 8 hours' : 'Adults: 500mg every 8 hours',
  'trimethoprim-sulfamethoxazole': ageNum < 2 ? 'Not recommended in infants' : 'Adults: 160/800mg every 12 hours',
  'vancomycin': ageNum < 12 ? 'Children: 40mg/kg/day divided every 6-8 hours' : 'Adults: 15-20mg/kg every 8-12 hours IV',

  // ================= ANTIFUNGALS =================
  'fluconazole': ageNum < 12 ? 'Children: 6mg/kg/day once daily' : 'Adults: 150mg once weekly or 50-200mg daily',
  'itraconazole': ageNum < 12 ? 'Children: 2-5mg/kg/day' : 'Adults: 100-200mg daily',
  'ketoconazole': ageNum < 12 ? 'Children: 2-4mg/kg/day' : 'Adults: 200-400mg daily',
  'clotrimazole': 'Topical: apply 2-3 times/day as cream',
  'miconazole': 'Topical: apply twice daily for 2-4 weeks',
  'terbinafine': ageNum < 12 ? 'Not recommended in children under 12' : 'Adults: 250mg once daily',

  // ================= ANTACIDS / GI =================
  'omeprazole': ageNum < 12 ? 'Children: 10-20mg once daily' : 'Adults: 20-40mg once daily before meals',
  'pantoprazole': ageNum < 12 ? 'Children: 20mg once daily' : 'Adults: 40mg once daily',
  'ranitidine': ageNum < 12 ? 'Children: 2-4mg/kg/day' : 'Adults: 150mg twice daily',
  'loperamide': ageNum < 12 ? 'Children: Not recommended under 2 yrs' : 'Adults: 4mg initially, then 2mg after each loose stool, max 16mg/day',
  'bismuth subsalicylate': ageNum < 12 ? 'Not recommended' : 'Adults: 525mg every 30-60min up to 8 doses/day',
  'antacids': 'Take 1-2 tablets after meals\nDo not exceed recommended dose',
  'simethicone': 'Adults & children: 40-125mg after meals and at bedtime',

  // ================= ANTIHISTAMINES =================
  'cetirizine': ageNum < 12 ? 'Children: 5-10mg once daily' : 'Adults: 10mg once daily',
  'loratadine': ageNum < 12 ? 'Children: 5-10mg once daily' : 'Adults: 10mg once daily',
  'diphenhydramine': ageNum < 12 ? 'Children: 1mg/kg/dose every 6-8 hours' : 'Adults: 25-50mg every 6 hours',
  'fexofenadine': ageNum < 12 ? 'Children: 30mg twice daily' : 'Adults: 180mg once daily',
  'promethazine': ageNum < 2 ? 'Avoid in infants under 2' : 'Adults: 25mg every 4-6 hours',

  // ================= VITAMINS & SUPPLEMENTS =================
  'vitamin c': ageNum < 12 ? 'Children: 30-75mg/day' : 'Adults: 500-1000mg/day',
  'vitamin d': ageNum < 12 ? 'Children: 400-600IU/day' : 'Adults: 800-2000IU/day',
  'iron': ageNum < 12 ? 'Children: 10-20mg/day elemental iron' : 'Adults: 18mg/day (pregnant 27mg/day)',
  'calcium': ageNum < 12 ? 'Children: 500-1000mg/day' : 'Adults: 1000-1200mg/day',
  'magnesium': ageNum < 12 ? 'Children: 80-240mg/day' : 'Adults: 310-420mg/day',
  'zinc': ageNum < 12 ? 'Children: 5-10mg/day' : 'Adults: 8-11mg/day',
  'vitamin b12': ageNum < 12 ? 'Children: 0.9-1.2mcg/day' : 'Adults: 2.4mcg/day',
  'folic acid': ageNum < 12 ? 'Children: 150-400mcg/day' : 'Adults: 400mcg/day',
  'omega 3': 'Children: 250-500mg/day DHA/EPA, Adults: 1000mg/day',
  
  // ================= RESPIRATORY =================
  'albuterol inhaler': ageNum < 4 ? 'Consult pediatrician' : 'Adults: 90-180mcg every 4-6 hours as needed',
  'salbutamol inhaler': ageNum < 4 ? 'Consult pediatrician' : 'Adults: 100-200mcg every 4-6 hours as needed',
  'budesonide inhaler': ageNum < 6 ? 'Consult pediatrician' : 'Adults: 180-360mcg twice daily',
  'fluticasone inhaler': ageNum < 6 ? 'Consult pediatrician' : 'Adults: 100-250mcg twice daily',

  // ================= MISCELLANEOUS =================
  'oral rehydration': 'Mix ORS packet in 1L water\nDrink frequently in small amounts',
  'rest': 'Get plenty of rest and sleep\n7-9 hours recommended for adults',
  'fluids': 'Drink 8-10 glasses of water daily\nIncrease intake if fever present',
  'pain relievers': ageNum < 12 ? 'Consult pediatrician for dosage' : 'Follow package instructions\nTake with food',
  'topical steroids': 'Apply thin layer 1-2 times/day on affected area',
  'antiseptic cream': 'Apply 1-3 times daily on wound or infection',
  'antifungal cream': 'Apply 2-3 times daily for 2-4 weeks',
  'lozenges': 'Adults & Children (6+ yrs): 1 lozenge every 2–3 hours',
  'gargle': 'Gargle warm salt water 2–3 times/day',


  // ================= ANTIBIOTICS (continued) =================
  'amoxicillin-clavulanate': ageNum < 12 ? 'Children: 20-40mg/kg/day divided every 8 hours' : 'Adults: 875/125mg every 12 hours',
  'cefotaxime': ageNum < 12 ? 'Children: 50mg/kg/day divided every 8 hours' : 'Adults: 1-2g every 8 hours',
  'ceftriaxone': ageNum < 12 ? 'Children: 50-75mg/kg/day IV/IM' : 'Adults: 1-2g daily IV/IM',
  'ceftazidime': ageNum < 12 ? 'Children: 50mg/kg every 8 hours' : 'Adults: 1-2g every 8 hours',
  'clarithromycin': ageNum < 12 ? 'Children: 7.5mg/kg every 12 hours' : 'Adults: 250-500mg every 12 hours',
  'erythromycin': ageNum < 12 ? 'Children: 30-50mg/kg/day divided every 6 hours' : 'Adults: 250-500mg every 6 hours',
  'tetracycline': ageNum < 8 ? 'Not recommended' : 'Adults: 250-500mg every 6 hours',
  'linezolid': ageNum < 12 ? 'Children: 10mg/kg every 8 hours' : 'Adults: 600mg every 12 hours',
  
  'daptomycin': ageNum < 12 ? 'Consult pediatrician' : 'Adults: 4mg/kg once daily IV',

  // ================= ANTIFUNGALS (continued) =================
  'griseofulvin': ageNum < 2 ? 'Not recommended under 2 yrs' : 'Adults: 500mg/day divided doses for 2-6 weeks',
  'nystatin': 'Oral: 100,000-200,000 units 4 times daily',
  'amphotericin b': ageNum < 12 ? 'Consult pediatrician' : 'Adults: 0.3-1mg/kg/day IV',
  'terbinafine': ageNum < 12 ? 'Not recommended under 12 yrs' : 'Adults: 250mg once daily for 2-12 weeks',
  'clotrimazole': 'Topical: Apply 2-3 times/day',
  'miconazole': 'Topical: Apply 2-3 times/day',
  'ketoconazole': ageNum < 12 ? 'Children: 2-4mg/kg/day' : 'Adults: 200-400mg daily',
  'itraconazole': ageNum < 12 ? 'Children: 2-5mg/kg/day' : 'Adults: 100-200mg daily',
  'fluconazole': ageNum < 12 ? 'Children: 6mg/kg/day' : 'Adults: 150mg once weekly or 50-200mg daily',

  // ================= RESPIRATORY =================
  'salmeterol': ageNum < 12 ? 'Children: Consult doctor' : 'Adults: 50mcg twice daily inhalation',
  'formoterol': ageNum < 12 ? 'Children: Consult doctor' : 'Adults: 12-24mcg twice daily inhalation',
  'tiotropium': ageNum < 12 ? 'Children: Not recommended' : 'Adults: 18mcg once daily inhalation',
  'fluticasone-salmeterol': ageNum < 12 ? 'Children: Not recommended' : 'Adults: 1 inhalation twice daily',
  'budesonide-formoterol': ageNum < 12 ? 'Children: Not recommended' : 'Adults: 2 inhalations twice daily',
  'montelukast': ageNum < 6 ? 'Children: 4mg/day' : 'Adults: 10mg/day',
  'zafirlukast': ageNum < 12 ? 'Children: 10-20mg twice daily' : 'Adults: 20mg twice daily',
  'theophylline': ageNum < 12 ? 'Children: 5-10mg/kg/day' : 'Adults: 300-400mg/day divided doses',

  // ================= VITAMINS & SUPPLEMENTS =================
  'vitamin a': ageNum < 12 ? 'Children: 300-600mcg/day' : 'Adults: 700-900mcg/day',
  'vitamin e': ageNum < 12 ? 'Children: 6-11IU/day' : 'Adults: 15IU/day',
  'vitamin k': ageNum < 12 ? 'Children: 30-55mcg/day' : 'Adults: 90-120mcg/day',
  'biotin': ageNum < 12 ? 'Children: 8-12mcg/day' : 'Adults: 30mcg/day',
  'niacin': ageNum < 12 ? 'Children: 10-15mg/day' : 'Adults: 14-16mg/day',
  'riboflavin': ageNum < 12 ? 'Children: 0.6-1mg/day' : 'Adults: 1.3mg/day',
  'thiamine': ageNum < 12 ? 'Children: 0.5-1mg/day' : 'Adults: 1.2mg/day',
  'pantothenic acid': ageNum < 12 ? 'Children: 2-4mg/day' : 'Adults: 5mg/day',
  'iodine': ageNum < 12 ? 'Children: 90-120mcg/day' : 'Adults: 150mcg/day',
  'selenium': ageNum < 12 ? 'Children: 20-40mcg/day' : 'Adults: 55mcg/day',

  // ================= GI / DIGESTIVE =================
  'dicyclomine': ageNum < 12 ? 'Children: 10-20mg 3-4 times/day' : 'Adults: 10-20mg 3-4 times/day',
  'hyoscine butylbromide': ageNum < 12 ? 'Children: 0.2mg/kg per dose' : 'Adults: 10-20mg 3-4 times/day',
  'metoclopramide': ageNum < 12 ? 'Children: 0.1-0.15mg/kg/dose' : 'Adults: 10mg 3 times/day',
  'domperidone': ageNum < 12 ? 'Children: 0.25-0.5mg/kg/dose' : 'Adults: 10mg 3 times/day',
  'lactulose': ageNum < 12 ? 'Children: 5-10ml/day' : 'Adults: 15-30ml/day',
  'magnesium hydroxide': ageNum < 12 ? 'Children: 1-2ml/kg/day' : 'Adults: 400-800mg/day',
  'aluminium hydroxide': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',
  'sodium bicarbonate': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',
  'sodium hypochlorite': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',
  'sodium chloride': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',
  'sodium citrate': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',
  'sodium lactate': ageNum < 12 ? 'Children: 1-2ml/kg/dose' : 'Adults: 500-1000mg 3-4 times/day',

  'pepto bismol': ageNum < 12 ? 'Not recommended' : 'Adults: 524mg every 30-60min up to 8 doses/day',
  'peptobismol': ageNum < 12 ? 'Not recommended' : 'Adults: 524mg every 30-60min up to 8 doses/day',

  'pepto-bismol': ageNum < 12 ? 'Not recommended' : 'Adults: 524mg every 30-60min up to 8 doses/day',

  // ================= MISCELLANEOUS / HOME REMEDIES =================
  'honey': ageNum < 1 ? 'Not for infants under 1' : '1-2 teaspoons as needed',
  'ginger': 'Children: 1-2g/day, Adults: 2-4g/day',
  'lemon': 'Children: 1 tsp juice, Adults: 1-2 tbsp juice',
  'garlic': 'Children: 0.25-0.5g/day, Adults: 1-2g/day',
  'peppermint': 'Children: 1-2 tsp tea, Adults: 2-3 tsp tea',
  'turmeric': 'Children: 0.25-0.5g/day, Adults: 1-3g/day',
  'aloe vera': 'Topical: apply thin layer 1-2 times/day',
  'calamine': 'Topical: 1-2 times daily on rash',
  'salt water gargle': 'Gargle 2-3 times/day',
  'hydration': 'Children: 8-10 glasses/day, Adults: 2-3 liters/day',
};


    const medicineLower = medicine.toLowerCase();
    for (const [key, value] of Object.entries(dosageMap)) {
      if (medicineLower.includes(key)) {
        return value;
      }
    
    return "";
  }
  };

  const getPrecautions = (medicine:string) => {
    const precautionMap: Record<string, string> = {
  // ================= PAIN RELIEVERS =================
  'ibuprofen': 'Take with food. Avoid if you have stomach ulcers or kidney problems.',
  'paracetamol': 'Do not exceed maximum daily dose. Avoid alcohol.',
  'acetaminophen': 'Do not combine with other products containing acetaminophen.',
  'naproxen': 'Take with food. Avoid if history of ulcers or kidney problems.',
  'aspirin': 'Do not use in children under 16. Take with food. May increase bleeding risk.',
  'ketorolac': 'Use short-term only. Avoid if kidney issues or ulcers present.',
  'hydrocodone': 'May cause drowsiness. Avoid driving. Take only as prescribed.',
  'oxycodone': 'Risk of dependency. Take only as prescribed. Avoid alcohol.',
  'fentanyl': 'High risk of overdose. Use only under strict supervision.',
  'morphine': 'May cause respiratory depression. Take exactly as prescribed.',
  'hydromorphone': 'Avoid alcohol. Risk of dependency. Take as directed.',
  'indomethacin': 'Take with food. May cause stomach upset or dizziness.',
  'mefenamic acid': 'Take with food. Not recommended during pregnancy.',
  'celecoxib': 'Avoid if allergic to NSAIDs. May increase heart attack risk.',

  // ================= ANTIBIOTICS =================
  'amoxicillin': 'Complete full course. May cause diarrhea or nausea.',
  'amoxicillin-clavulanate': 'Take with food. Complete full course.',
  'cephalexin': 'Take on empty stomach or as directed. Complete full course.',
  'cefuroxime': 'Take with food. Complete full course.',
  'ceftriaxone': 'IV/IM only. Monitor for allergic reactions.',
  'cefotaxime': 'IV only. Complete full course.',
  'ceftazidime': 'Monitor kidney function during use.',
  'clarithromycin': 'Take with food. May interact with other drugs.',
  'erythromycin': 'Take on empty stomach. Monitor for GI upset.',
  'tetracycline': 'Avoid in children <8 years. Can cause teeth discoloration.',
  'doxycycline': 'Take with water. Avoid sun exposure.',
  'linezolid': 'Avoid foods high in tyramine. May cause low blood counts.',
  'vancomycin': 'Monitor kidney function. IV administration only.',
  'daptomycin': 'Monitor creatine phosphokinase levels.',

  // ================= ANTIFUNGALS =================
  'griseofulvin': 'Take with fatty meal to improve absorption. Avoid alcohol.',
  'nystatin': 'Swish and swallow as directed. Avoid swallowing large amounts at once.',
  'amphotericin b': 'Monitor kidney function. IV use only.',
  'terbinafine': 'Avoid alcohol. Monitor liver function.',
  'clotrimazole': 'Topical use only. Avoid eyes and mouth.',
  'miconazole': 'Topical use only. Avoid broken skin.',
  'ketoconazole': 'Take with food. Avoid alcohol.',
  'itraconazole': 'Take with food. Monitor liver function.',
  'fluconazole': 'Take exactly as prescribed. Monitor liver function.',

  // ================= RESPIRATORY =================
  'albuterol': 'Use as directed. Do not exceed recommended inhalations.',
  'salmeterol': 'Do not use for acute attacks. Use exactly as prescribed.',
  'formoterol': 'Do not use for immediate relief. Monitor heart rate.',
  'tiotropium': 'Use once daily. Rinse mouth after inhalation.',
  'fluticasone-salmeterol': 'Rinse mouth after use. Not for immediate relief.',
  'budesonide-formoterol': 'Rinse mouth after use. Do not use for acute attacks.',
  'montelukast': 'Take at same time daily. Not for acute asthma attacks.',
  'zafirlukast': 'Take on empty stomach. Monitor for liver issues.',
  'theophylline': 'Do not exceed prescribed dose. Monitor for nausea and palpitations.',

  // ================= GI / DIGESTIVE =================
  'dicyclomine': 'Take before meals. May cause drowsiness.',
  'hyoscine butylbromide': 'Avoid in glaucoma or urinary obstruction.',
  'metoclopramide': 'Avoid long-term use. May cause movement disorders.',
  'domperidone': 'Do not exceed recommended dose. Monitor heart rhythm.',
  'lactulose': 'May cause bloating or diarrhea. Drink plenty of water.',
  'magnesium hydroxide': 'Do not use for long periods without doctor advice.',
  'aluminium hydroxide': 'Do not exceed recommended dose. Take between meals.',
  'simethicone': 'Generally safe. Take as needed after meals.',
  'bismuth subsalicylate': 'Avoid in children with viral illness. Can cause black stool.',
  'pepto-bismol': 'Avoid in children <12. Do not exceed recommended dose.',

  // ================= VITAMINS & SUPPLEMENTS =================
  'vitamin a': 'Do not exceed recommended daily intake. Can be toxic in high doses.',
  'vitamin d': 'Monitor calcium intake. Avoid excessive supplementation.',
  'vitamin e': 'Avoid high doses. May increase bleeding risk.',
  'vitamin k': 'Avoid if on anticoagulants without doctor advice.',
  'biotin': 'Generally safe. Follow recommended daily dose.',
  'niacin': 'May cause flushing. Avoid high doses without supervision.',
  'riboflavin': 'Generally safe. Follow recommended daily dose.',
  'thiamine': 'Generally safe. Follow recommended daily dose.',
  'pantothenic acid': 'Generally safe. Follow recommended daily dose.',
  'iodine': 'Avoid excess intake. May affect thyroid function.',
  'selenium': 'Do not exceed recommended daily dose.',

  // ================= HOME REMEDIES / NATURAL =================
  'honey': 'Do not give to infants under 1 year. Otherwise safe.',
  'ginger': 'May cause mild heartburn. Use in moderation.',
  'lemon': 'Can cause enamel erosion if consumed excessively.',
  'garlic': 'May cause mild GI upset. Use in moderation.',
  'peppermint': 'Avoid in GERD patients. Use in moderation.',
  'turmeric': 'Generally safe. Can cause mild GI upset in large doses.',
  'aloe vera': 'Topical use only. Avoid broken skin.',
  'calamine': 'Topical use only. Avoid eyes and mouth.',
  'salt water gargle': 'Do not swallow the solution. Safe for most patients.',
  'hydration': 'Ensure adequate daily water intake.',

  // ================= ADDITIONAL COMMON MEDS =================
  'amlodipine': 'Take at same time daily. Monitor blood pressure.',
  'lisinopril': 'Avoid potassium supplements without doctor advice.',
  'atorvastatin': 'Take at bedtime. Avoid grapefruit juice.',
  'simvastatin': 'Take in evening. Avoid grapefruit juice.',
  'metformin': 'Take with meals. Monitor blood sugar.',
  'glipizide': 'Take 30 minutes before meal. Monitor for hypoglycemia.',
  'levothyroxine': 'Take on empty stomach. Avoid calcium or iron at same time.',
  'sertraline': 'May take 4-6 weeks for effect. Avoid abrupt discontinuation.',
  'fluoxetine': 'Monitor mood changes. Avoid abrupt discontinuation.',
  'loratadine': 'Generally safe. May cause mild drowsiness.',
  'cetirizine': 'May cause mild drowsiness. Avoid driving if affected.',
  'diphenhydramine': 'May cause drowsiness. Avoid driving or operating machinery.',

  // ================= MORE COMMON MEDICINES =================
  'omeprazole': 'Take 30 minutes before meal. Do not crush or chew.',
  'pantoprazole': 'Take before meals. Avoid prolonged use without doctor advice.',
  'lansoprazole': 'Take on empty stomach. Avoid alcohol.',
  'ranitidine': 'Avoid long-term use. Consult doctor.',
  'famotidine': 'Generally safe. Follow prescribed dose.',
  'lorazepam': 'May cause drowsiness. Avoid alcohol.',
  'diazepam': 'May cause drowsiness. Avoid alcohol. Risk of dependency.',
  'alprazolam': 'Avoid alcohol. Risk of dependency. Take as prescribed.',
  'zolpidem': 'Take just before bed. May cause next-day drowsiness.',
  'melatonin': 'Use short-term unless advised by doctor.',
  'magnesium': 'Do not exceed recommended daily dose. May cause diarrhea.',
  'calcium': 'Take with food. Avoid exceeding daily limit.',
  'iron': 'Take on empty stomach for best absorption. May cause constipation.',

  // ================= CONTINUE ADDING UNTIL 300+ =================
  // You can replicate the same structure for remaining pain meds, antibiotics,
  // antihypertensives, antidiabetics, respiratory meds, vitamins, and home remedies.
};


    const medicineLower = medicine.toLowerCase();
    for (const [key, value] of Object.entries(precautionMap)) {
      if (medicineLower.includes(key)) {
        return value;
      }
    }

    return 'Consult healthcare provider before use. Follow prescribed instructions.';
  };

  const getGenderWarning = (medicine:string, gender:string) => {
    if (gender.toLowerCase() === 'female') {
      const medicineLower = medicine.toLowerCase();
      if (medicineLower.includes('nsaid') || medicineLower.includes('ibuprofen')) {
        return 'Pregnant or nursing women should consult doctor before use';
      }
      if (medicineLower.includes('antibiotic') || medicineLower.includes('penicillin')) {
        return 'Inform doctor if pregnant, planning pregnancy, or breastfeeding';
      }
    }
    return null;
  };

  const handleSearch = async () => {
    setError('');
    setRecommendations([]);
    setHomeRemedySuggestions([]);

    if (!dataLoaded) {
      setError('Medical database is still loading. Please wait a moment and try again.');
      return;
    }

    if (!symptoms.trim()) {
      setError('Please enter your symptoms');
      return;
    }

    if (!gender) {
      setError('Please select your gender');
      return;
    }
    const ageNum = parseInt(age.toString());
    if (!ageNum || ageNum < 0 || ageNum > 120) {
      setError('Please enter a valid age (0-120)');
      return;
    }

    setLoading(true);
    setModelStatus('AI analyzing your symptoms...');

    try {
      // Get AI-powered recommendations
      const aiRecommendations = await getAIRecommendations(symptoms, gender, age);
      if(!medicalData)return[];
      if (aiRecommendations.length === 0) {
        setError('No matching recommendations found. Please consult a healthcare professional.');
        setModelStatus(`AI Model ready with ${medicalData.length} medical records`);
      } else {
        setRecommendations(aiRecommendations);
        setModelStatus(`AI Model ready with ${medicalData.length} medical records`);
        
        // Fetch home remedies for the symptoms
        const symptomWords = symptoms.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
        const uniqueSymptoms = [...new Set(symptomWords)];
        
        let allRemedies:HomeRemedy[] = [];
        for (const symptom of uniqueSymptoms.slice(0, 2)) {
          try {
            const webRemedies = await fetchHomeRemediesFromWeb(symptom);
            allRemedies = [...allRemedies, ...webRemedies];
          } catch (err) {
            console.error('Error fetching remedies for', symptom, err);
          }
        }
        
        setHomeRemedySuggestions(allRemedies);
      }
    } catch (error) {
      console.error('Error in search:', error);
      setError('An error occurred while searching. Please try again.');
      setModelStatus(`AI Model ready with ${medicalData?.length||0} medical records`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#40916c] via-[#2d6a4f] to-[#1b4332] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#52b788] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#74c69d] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#40916c] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Pill className="w-12 h-12 text-[#95d5b2] animate-pulse" />
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">MediMyst - A Medicine Recommendation System</h1>
          </div>
          <p className="text-[#d8f3dc] max-w-2xl mx-auto mb-3">
            Get personalized medicine recommendations powered by AI trained on medical records.
            Always consult a healthcare professional for serious conditions.
          </p>
          <div className="flex items-center justify-center gap-2 text-[#95d5b2] text-sm">
            <div className="w-2 h-2 bg-[#52b788] rounded-full animate-pulse"></div>
            <span>{modelStatus}</span>
          </div>
        </div>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-2xl shadow-2xl p-8 mb-8 border border-[#52b788] animate-slide-up backdrop-blur-sm">
          <div className="space-y-6">
            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Selection */}
              <div className="transform transition-all duration-300 hover:scale-105">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#b7e4c7] mb-3">
                  <User className="w-4 h-4 text-[#95d5b2]" />
                  Gender
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-[#40916c] focus:ring-[#52b788]"
                    />
                    <span className="text-[#d8f3dc] group-hover:text-[#95d5b2] transition-colors">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-[#40916c] focus:ring-[#52b788]"
                    />
                    <span className="text-[#d8f3dc] group-hover:text-[#95d5b2] transition-colors">Female</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={gender === 'other'}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-4 h-4 text-[#40916c] focus:ring-[#52b788]"
                    />
                    <span className="text-[#d8f3dc] group-hover:text-[#95d5b2] transition-colors">Other</span>
                  </label>
                </div>
              </div>

              {/* Age Input */}
              <div className="transform transition-all duration-300 hover:scale-105">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#b7e4c7] mb-3">
                  <Calendar className="w-4 h-4 text-[#95d5b2]" />
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 bg-[#1b4332] border-2 border-[#40916c] text-[#d8f3dc] placeholder-[#74c69d] rounded-lg focus:outline-none focus:border-[#52b788] focus:ring-2 focus:ring-[#52b788] focus:ring-opacity-50 transition-all duration-300"
                />
              </div>
            </div>

            {/* Symptoms Input */}
            <div className="transform transition-all duration-300 hover:scale-105">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#b7e4c7] mb-3">
                <Search className="w-4 h-4 text-[#95d5b2]" />
                Symptoms
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms (e.g., fever, headache, cold, cough, stomach pain)"
                className="w-full px-4 py-3 bg-[#1b4332] border-2 border-[#40916c] text-[#d8f3dc] placeholder-[#74c69d] rounded-lg focus:outline-none focus:border-[#52b788] focus:ring-2 focus:ring-[#52b788] focus:ring-opacity-50 resize-none transition-all duration-300" rows={4}
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !dataLoaded}
              className="w-full bg-gradient-to-r from-[#40916c] to-[#52b788] text-white font-semibold py-4 rounded-lg hover:from-[#52b788] hover:to-[#74c69d] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI analyzing symptoms...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🤖</span>
                  <span>Get AI-Powered Recommendations</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-900 bg-opacity-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-shake backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* User Info Display */}
        {(gender || age) && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-[#2d6a4f] bg-opacity-60 backdrop-blur-sm rounded-lg border border-[#52b788] animate-slide-down">
            <p className="text-[#d8f3dc] text-sm">
              <strong>Profile:</strong> {gender && `${gender.charAt(0).toUpperCase() + gender.slice(1)}`}
              {age && `, ${age} years old`}
            </p>
          </div>
        )}
        

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 animate-slide-right">
                <Pill className="w-6 h-6 text-[#436954]" />
                AI-Recommended Medicines
              </h2>
              <span className="px-3 py-1 bg-[#52b788] bg-opacity-50 text-[#d8f3dc] rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                <span className="text-sm">🤖</span> AI-Powered
              </span>
            </div>
            <div className="space-y-4">
              {recommendations.map((med, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-xl shadow-2xl p-6 border-2 border-[#40916c] hover:border-[#52b788] transition-all duration-300 transform hover:scale-105 hover:shadow-[#40916c]/50 animate-slide-up backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#95d5b2]">{med.name}</h3>
                      {med.confidence && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          med.confidence === 'high' ? 'bg-green-600 text-white' :
                          med.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {med.confidence} confidence
                        </span>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-[#40916c] text-[#d8f3dc] rounded-full text-sm font-medium">
                      {med.disease}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="transform transition-all duration-300 hover:translate-x-2">
                      <p className="text-sm font-semibold text-[#b7e4c7] mb-1">Symptoms Matched:</p>
                      <p className="text-[#d8f3dc] text-sm">{med.symptoms}</p>
                    </div>

                    {med.name && (
                      <div className="transform transition-all duration-300 hover:translate-x-2">
                        <p className="text-sm font-semibold text-[#b7e4c7] mb-1">Medicine Name:</p>
                        <p className="text-[#d8f3dc] text-sm">{med.name}</p>
                      </div>
                    )}
                    
                    <div className="transform transition-all duration-300 hover:translate-x-2">
                      <p className="text-sm font-semibold text-[#b7e4c7] mb-1">Dosage:</p>
                      <p className="text-[#d8f3dc] whitespace-pre-line text-sm">{med.dosage}</p>
                    </div>
                    
                    <div className="transform transition-all duration-300 hover:translate-x-2">
                      <p className="text-sm font-semibold text-[#b7e4c7] mb-1">Precautions:</p>
                      <p className="text-[#d8f3dc] text-sm">{med.precautions}</p>
                    </div>

                    {med.genderWarning && (
                      <div className="mt-3 p-3 bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500 rounded animate-pulse backdrop-blur-sm">
                        <p className="text-yellow-200 text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {med.genderWarning}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
        )}  
           {/* Disclaimer */}
            <div className="mt-8 p-6 bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500 rounded-lg animate-fade-in backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-semibold text-yellow-200 mb-2">Important Disclaimer</p>
                  <p className="text-yellow-100 text-sm">
                    These recommendations are generated by an AI model trained on medical records. 
                    The AI analyzes patterns in symptoms, diseases, and treatments to provide personalized suggestions. 
                    However, this tool is not a substitute for professional medical advice. Always consult a healthcare 
                    professional before starting any medication, especially if you have underlying health conditions, 
                    are pregnant, or are taking other medications.
                  </p>
                </div>
              </div>
            </div>
          </div>

        {/* Home Remedies Section */}
        {homeRemedySuggestions.length > 0 && (
          <div className="max-w-3xl mx-auto mt-12 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 animate-slide-right">
                <span className="text-3xl">🌿</span>
                Natural Home Remedies
              </h2>
              <span className="px-3 py-1 bg-[#52b788] bg-opacity-50 text-[#d8f3dc] rounded-full text-xs font-medium backdrop-blur-sm">
                From Web Search
              </span>
            </div>
            <p className="text-[#b7e4c7] mb-6 text-sm">
              These natural remedies have been gathered from trusted health sources on the web. Try these alongside or as alternatives to medication.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeRemedySuggestions.map((remedy, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] rounded-xl shadow-xl p-5 border-2 border-[#40916c] hover:border-[#74c69d] transition-all duration-300 transform hover:scale-105 hover:shadow-[#52b788]/50 animate-slide-up backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0 animate-bounce" style={{ animationDelay: `${index * 200}ms` }}>
                      {remedy.icon}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#95d5b2] mb-2">
                        {remedy.remedy}
                      </h3>
                      <p className="text-[#d8f3dc] text-sm leading-relaxed">
                        {remedy.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Natural Remedy Disclaimer */}
            <div className="mt-6 p-4 bg-[#2d6a4f] bg-opacity-60 border-l-4 border-[#74c69d] rounded-lg backdrop-blur-sm">
              <p className="text-[#b7e4c7] text-sm flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>
                  <strong>Tip:</strong> Home remedies work best when combined with proper rest, hydration, and a healthy diet. These suggestions are gathered from web sources and should not replace professional medical advice. If symptoms persist for more than a few days or worsen, please seek medical attention.
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
  );
}