export default function TriageBanner({ level }) {
  const color =
    level === "red"
      ? "bg-red-600"
      : level === "amber"
      ? "bg-amber-500"
      : "bg-green-600";

  const label =
    level === "red"
      ? "Seek emergency care immediately"
      : level === "amber"
      ? "Consult a clinician soon"
      : "Self-care possible";

  return (
    <div
      className={`${color} text-white text-center p-4 rounded-2xl shadow-lg text-lg font-semibold`}
      role="status"
      aria-live="assertive"
    >
      {label}
    </div>
  );
}
