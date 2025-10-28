export default function Stepper({ current, total }) {
  return (
    <div className="flex justify-between mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 mx-1 rounded-full ${
            i + 1 <= current ? "bg-blue-600" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
