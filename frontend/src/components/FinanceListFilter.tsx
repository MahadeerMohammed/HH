import { IonButton, IonIcon } from "@ionic/react";
import {
  calendarOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  filterOutline,
  refreshOutline
} from "ionicons/icons";

export type FinanceFilterPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

interface PageState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface FinanceListFilterProps {
  period: FinanceFilterPeriod;
  fromDate: string;
  toDate: string;
  open: boolean;
  loading: boolean;
  pageState: PageState;
  onPeriodChange: (period: FinanceFilterPeriod) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
}

const periodLabels: Record<FinanceFilterPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Date Range"
};

export const FinanceListFilter = ({
  period,
  fromDate,
  toDate,
  open,
  loading,
  pageState,
  onPeriodChange,
  onFromDateChange,
  onToDateChange,
  onOpenChange,
  onApply,
  onReset,
  onPageChange
}: FinanceListFilterProps) => {
  const pageNumber = pageState.totalPages === 0 ? 0 : pageState.page + 1;

  return (
    <section className="finance-list-filter">
      <header className="finance-list-filter__header">
        <button
          type="button"
          className="finance-list-filter__toggle"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
        >
          <IonIcon icon={filterOutline} aria-hidden="true" />
          <span>Filters</span>
          <IonIcon icon={open ? chevronUpOutline : chevronDownOutline} aria-hidden="true" />
        </button>
        <div className="finance-list-filter__summary">
          <span>{periodLabels[period]}</span>
          <span>{pageState.size} per page</span>
        </div>
      </header>

      {open ? (
        <div className="finance-list-filter__body">
          <label className="field">
            <span>List Range</span>
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as FinanceFilterPeriod)}
              disabled={loading}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Date Range</option>
            </select>
          </label>

          <label className="field">
            <span>From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              disabled={loading || period !== "custom"}
            />
          </label>

          <label className="field">
            <span>To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              disabled={loading || period !== "custom"}
            />
          </label>

          <div className="finance-list-filter__actions">
            <IonButton onClick={onApply} disabled={loading}>
              <IonIcon icon={calendarOutline} slot="start" />
              Apply
            </IonButton>
            <IonButton fill="outline" color="dark" onClick={onReset} disabled={loading}>
              <IonIcon icon={refreshOutline} slot="start" />
              Reset
            </IonButton>
          </div>
        </div>
      ) : null}

      <footer className="finance-list-pagination">
        <IonButton
          fill="outline"
          color="dark"
          onClick={() => onPageChange(pageState.page - 1)}
          disabled={loading || pageState.first || pageState.totalPages === 0}
        >
          <IonIcon icon={chevronBackOutline} slot="start" />
          Prev
        </IonButton>
        <span>
          Page {pageNumber} of {pageState.totalPages} | {pageState.totalElements} records
        </span>
        <IonButton
          fill="outline"
          color="dark"
          onClick={() => onPageChange(pageState.page + 1)}
          disabled={loading || pageState.last || pageState.totalPages === 0}
        >
          Next
          <IonIcon icon={chevronForwardOutline} slot="end" />
        </IonButton>
      </footer>
    </section>
  );
};
