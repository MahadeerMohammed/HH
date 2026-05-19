import { IonIcon } from "@ionic/react";
import { arrowDownOutline, arrowUpOutline } from "ionicons/icons";

interface MetricCardProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning";
  hint?: string;
}

export const MetricCard = ({ label, value, tone = "neutral", hint }: MetricCardProps) => (
  <article className={`metric-card metric-card--${tone}`}>
    <div className="metric-card__header">
      <span>{label}</span>
      {hint ? (
        <span className="metric-card__hint">
          <IonIcon icon={tone === "warning" ? arrowDownOutline : arrowUpOutline} />
          {hint}
        </span>
      ) : null}
    </div>
    <strong>{value}</strong>
  </article>
);
