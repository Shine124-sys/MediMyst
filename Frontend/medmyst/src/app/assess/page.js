"use client";
import { useState } from "react";
import Stepper from "./components/Stepper";
import DemographicsForm from "./components/DemographicsForm";
import SymptomsForm from "./components/SymptomsForm";
import MedsAllergiesForm from "./components/MedsAllergiesForm";
import ConsentReview from "./components/ConsentReview";

export default function AssessPage() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    symptoms: "",
    meds: "",
    allergies: "",
  });
  const [step, setStep] = useState(1);
  const total = 4;

  const next = () => setStep(s => Math.min(total, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return (
    <section className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow">
      <Stepper current={step} total={total} />
      {step === 1 && <DemographicsForm formData={formData} setFormData={setFormData} onNext={next} />}
      {step === 2 && <SymptomsForm formData={formData} setFormData={setFormData} onNext={next} onBack={back} />}
      {step === 3 && <MedsAllergiesForm formData={formData} setFormData={setFormData} onNext={next} onBack={back} />}
      {step === 4 && <ConsentReview formData={formData} onSubmit={() => {}} onBack={back} />}
    </section>
  );
}
