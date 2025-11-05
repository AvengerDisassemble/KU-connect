import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard = ({
  label,
  value,
}: StatCardProps) => {
  return (
    <Card
      className="
        relative overflow-hidden rounded-2xl
        bg-bg-2
        shadow-[0_8px_24px_rgba(17,24,39,0.06)]
        border border-transparent
        py-4
      "
    >
      <span
        aria-hidden
        className="
          absolute inset-y-0 left-0 w-1
          bg-accent
          rounded-l-2xl
        "
      />

      <div className="p-6 pl-8">
        <p className="mb-2 text-sm text-black font-semibold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-4xl font-bold text-primary">
          {value}
        </p>
      </div>
    </Card>
  );
};

export default StatCard;
