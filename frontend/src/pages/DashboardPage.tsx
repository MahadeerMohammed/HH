import { IonSpinner } from "@ionic/react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatPercent } from "../lib/formatters";
import type { DashboardSummary } from "../types";

export const DashboardPage = () => {
  const { apiRequest } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await apiRequest<DashboardSummary>("/api/v1/dashboard");
        setSummary(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [apiRequest]);

  return (
    <WorkspacePage
        title="Operations Dashboard"
        description="Monitor profit, occupancy, and monthly movement across rooms and operating costs."
        notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >

      {loading ? (
        <div className="centered-state centered-state--panel">
          <IonSpinner name="crescent" />
          <p>Loading dashboard analytics...</p>
        </div>
      ) : summary ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Gross Revenue" value={formatCurrency(summary.grossRevenue)} tone="success" />
            <MetricCard label="Revenue Costs" value={formatCurrency(summary.revenueCosts)} tone="warning" />
            <MetricCard label="Operating Expenses" value={formatCurrency(summary.operatingExpenses)} tone="warning" />
            <MetricCard label="Net Profit" value={formatCurrency(summary.netProfit)} tone="success" />
            <MetricCard label="Occupancy" value={formatPercent(summary.occupancyRate)} />
            <MetricCard label="Occupied Rooms" value={`${summary.occupiedRooms}/${summary.activeRooms}`} />
          </div>

          <div className="content-grid content-grid--two">
            <SectionCard
              title="Revenue And Profit Trend"
              subtitle={`Last six months through ${summary.toDate}.`}
            >
              <div className="chart-shell">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={summary.trend}>
                    <defs>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d7874" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1d7874" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f4a259" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f4a259" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,61,62,0.08)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#f4a259" fill="url(#revenueFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" stroke="#1d7874" fill="url(#profitFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Executive View" subtitle="Current performance window used by the API.">
              <div className="insight-list">
                <div className="insight-row">
                  <span>Reporting window</span>
                  <strong>
                    {summary.fromDate} to {summary.toDate}
                  </strong>
                </div>
                <div className="insight-row">
                  <span>Cost ratio</span>
                  <strong>
                    {formatPercent(
                      summary.grossRevenue > 0
                        ? ((summary.revenueCosts + summary.operatingExpenses) / summary.grossRevenue) * 100
                        : 0
                    )}
                  </strong>
                </div>
                <div className="insight-row">
                  <span>Profit margin</span>
                  <strong>
                    {formatPercent(summary.grossRevenue > 0 ? (summary.netProfit / summary.grossRevenue) * 100 : 0)}
                  </strong>
                </div>
                <div className="insight-row">
                  <span>Room utilization</span>
                  <strong>{formatPercent(summary.occupancyRate)}</strong>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </WorkspacePage>
  );
};
