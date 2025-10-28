"use client";
import React from "react";

export default function MedsAllergiesForm({ formData, setFormData, onNext, onBack }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Step 3: Medications & Allergies</h2>
      
      <div className="space-y-4 text-gray-700">
        <textarea
          placeholder="Current medications (if any)"
          value={formData.meds || ""}
          onChange={(e) => setFormData({ ...formData, meds: e.target.value })}
          className="w-full border rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-400"
        />

        <textarea
          placeholder="Known allergies (if any)"
          value={formData.allergies || ""}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          className="w-full border rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-5 rounded-lg">
          ← Back
        </button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg">
          Next →
        </button>
      </div>
    </div>
  );
}
