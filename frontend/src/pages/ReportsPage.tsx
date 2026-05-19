import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { currentMonthStart, formatCurrency, formatPercent, today } from "../lib/formatters";
import type { ReportResponse } from "../types";

export const ReportsPage = () => {
  const { apiRequest, fetchWithAuth } = useAuth();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [fromDate, setFromDate] = useState(currentMonthStart());
  const [toDate, setToDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async (from = fromDate, to = toDate) => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<ReportResponse>(`/api/v1/reports?fromDate=${from}&toDate=${to}`);
      setReport(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const handleFilterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadReport(fromDate, toDate);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetchWithAuth(`/api/v1/reports/export?fromDate=${fromDate}&toDate=${toDate}`);
      if (!response.ok) {
        throw new Error("Unable to export report.");
      }
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hotelhub-report-${fromDate}-to-${toDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Unable to export report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <WorkspacePage
        title="Reports And Profitability"
        description="Generate a clean profitability window, inspect room performance, and export finance-ready CSV reports."
        actions={
          <form className="date-filter" onSubmit={handleFilterSubmit}>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <IonButton type="submit">Refresh</IonButton>
          </form>
        }
        notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >

      {loading ? (
        <div className="centered-state centered-state--panel">Loading report...</div>
      ) : report ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Gross Revenue" value={formatCurrency(report.grossRevenue)} tone="success" />
            <MetricCard label="Revenue Costs" value={formatCurrency(report.revenueCosts)} tone="warning" />
            <MetricCard label="Operating Expenses" value={formatCurrency(report.operatingExpenses)} tone="warning" />
            <MetricCard label="Net Profit" value={formatCurrency(report.netProfit)} tone="success" />
            <MetricCard label="Occupancy" value={formatPercent(report.occupancyRate)} />
          </div>

          <SectionCard
            title="Room Profitability"
            subtitle={`Reporting window: ${report.fromDate} to ${report.toDate}`}
            action={
              <IonButton fill="outline" color="dark" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? "Exporting..." : "Export CSV"}
              </IonButton>
            }
          >
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {report.roomPerformance.map((room) => (
                    <tr key={room.roomId}>
                      <td>
                        <strong>{room.roomNumber}</strong>
                        <small>{room.roomType}</small>
                      </td>
                      <td>{formatCurrency(room.revenue)}</td>
                      <td>{formatCurrency(room.expenses)}</td>
                      <td>{formatCurrency(room.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : null}
    </WorkspacePage>
  );
};
