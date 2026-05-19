import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export const SectionCard = ({ title, subtitle, children, action }: SectionCardProps) => (
  <section className="section-card">
    <header className="section-card__header">
      <div>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
    {children}
  </section>
);
