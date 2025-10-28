"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button"; // Ensure this path is correct
import Image from "next/image"; // You imported this, but it's not used — can remove if unnecessary

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center h-[90vh] text-center px-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-blue-700">
        Smart Symptom & Medicine Recommender
      </h1>
      <p className="text-gray-600 max-w-xl mb-10">
        Enter your age and symptoms to get safe, evidence-based over-the-counter
        medicine guidance — not a diagnosis, but reliable advice.
      </p>
      <Button label="Start Assessment" onClick={() => router.push("/assess")} />
    </main>
  );
}
