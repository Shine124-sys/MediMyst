export function Button({ label, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="btn-primary flex items-center gap-2 font-medium"
    >
      {label}
    </button>
  );
}
