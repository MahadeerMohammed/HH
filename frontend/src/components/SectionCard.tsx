import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export const SectionCard = ({ title, subtitle, children, action }: SectionCardProps) => (
  <section className="section-card">
    {title || subtitle || action ? (
      <header className="section-card__header">
        <div>
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
    ) : null}
    {children}
  </section>
);
