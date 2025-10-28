"use client";
import React from "react";

export default function DemographicsForm({ formData, setFormData, onNext }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Step 1: Basic Demographics</h2>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400"
        />
        
        <input
          type="number"
          placeholder="Age"
          value={formData.age || ""}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400"
        />

        <select
          value={formData.gender || ""}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <button
        onClick={onNext}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-all duration-300"
      >
        Next →
      </button>
    </div>
  );
}
