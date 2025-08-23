import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

export default function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <div className="group relative h-full">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
      <div className="relative h-full rounded-2xl border border-border/80 bg-secondary p-6 md:p-7 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-0.5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20">
            {icon}
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-card-foreground tracking-tight">{title}</h3>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4">{description}</p>
        {highlight ? (
          <p className="text-xs md:text-sm text-primary font-medium">{highlight}</p>
        ) : null}
      </div>
    </div>
  );
}
