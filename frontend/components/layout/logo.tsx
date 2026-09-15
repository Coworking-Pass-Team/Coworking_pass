export default function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Coworking Pass"
      className={`h-11 sm:h-12 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    />
  );
}