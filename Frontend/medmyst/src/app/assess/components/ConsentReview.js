"use client";
import React, { useState } from "react";

export default function ConsentReview({ formData, onSubmit, onBack }) {
  const [consent, setConsent] = useState(false);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Step 4: Review & Consent</h2>

      <div className="space-y-2 text-gray-700">
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Age:</strong> {formData.age}</p>
        <p><strong>Gender:</strong> {formData.gender}</p>
        <p><strong>Symptoms:</strong> {formData.symptoms}</p>
        <p><strong>Medications:</strong> {formData.meds}</p>
        <p><strong>Allergies:</strong> {formData.allergies}</p>
      </div>

      <div className="mt-6 border-t pt-4">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            I understand this tool provides <strong>recommendations only</strong> and does not replace
            a professional medical diagnosis.
          </span>
        </label>
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg">
          ← Back
        </button>
        <button
          disabled={!consent}
          onClick={onSubmit}
          className={`py-2 px-5 rounded-lg transition-all duration-300 ${
            consent
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Submit →
        </button>
      </div>
    </div>
  );
}
