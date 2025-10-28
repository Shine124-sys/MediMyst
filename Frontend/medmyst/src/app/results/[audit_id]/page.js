import TriageBanner from "@/components/TriageBanner";
import { Button } from "@/components/Button";

export default async function ResultPage({ params }) {
  const { audit_id } = params;
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/v1/audit/${audit_id}`,
    { cache: "no-store" }
  ).then(r => r.json());

  return (
    <main className="max-w-4xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold mb-4">Assessment Result</h1>
      <TriageBanner level={data.triage} />
      <div className="space-y-4 mt-6">
        {data.recommendations.map((rec, i) => (
          <div key={i} className="card">
            <h3 className="text-lg font-semibold">{rec.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{rec.dose}</p>
            <Button
              label="Why this recommendation?"
              onClick={() => alert(JSON.stringify(rec, null, 2))}
            />
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-6 italic">
        Not a diagnosis. For severe or uncertain symptoms, consult a clinician immediately.
      </p>
    </main>
  );
}
