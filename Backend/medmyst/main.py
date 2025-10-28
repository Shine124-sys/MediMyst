from fastapi import FastAPI
from pydantic import BaseModel
import uuid, datetime

app = FastAPI(
    title="Medmyst API",
    version="0.0.1",
)

# Define a data model for POST requests
class Item(BaseModel):
    name: str
    age: int
    gender: str
    symptoms: list[str]
    meds: list[str]
    allergies: list[str]

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}

# Dynamic GET endpoint
@app.get("/greet/{username}")
def greet_user(username: str):
    return {"message": f"Hello, {username}!"}

# Medicine suggestion endpoint
@app.post("/suggest-meds")
def suggest_meds(item: Item):
    # Example logic — replace with real medical logic or ML model
    suggestions = []
    for symptom in item.symptoms:
        if symptom.lower() == "fever":
            suggestions.append("Paracetamol")
        elif symptom.lower() == "cough":
            suggestions.append("Dextromethorphan")
        elif symptom.lower() == "headache":
            suggestions.append("Ibuprofen")

    # Filter out meds that conflict with allergies
    safe_suggestions = [med for med in suggestions if med.lower() not in [a.lower() for a in item.allergies]]

    return {
        "patient_id": str(uuid.uuid4()),
        "timestamp": datetime.datetime.now().isoformat(),
        "suggested_meds": safe_suggestions,
        "note": "These are general suggestions. Please consult a doctor for personalized advice."
    }