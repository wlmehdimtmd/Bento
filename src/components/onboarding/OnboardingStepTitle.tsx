import type { ReactNode } from "react";

interface OnboardingStepTitleProps {
  title: ReactNode;
  subtitle?: string;
}

export function OnboardingStepTitle({ title, subtitle }: OnboardingStepTitleProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
        {title}
      </h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
