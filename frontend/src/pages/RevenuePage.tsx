import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "../components/MetricCard";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { RevenueEntry } from "../types";

export const RevenuePage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<RevenueEntry[]>("/api/v1/revenue");
      setEntries(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load revenue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalGrossRevenue = entries.reduce((sum, entry) => sum + entry.grossRevenue, 0);
  const totalNetRevenue = entries.reduce((sum, entry) => sum + entry.netRevenue, 0);
  const totalRevenueCosts = entries.reduce(
    (sum, entry) => sum + entry.platformFee + entry.taxAmount + entry.variableCost,
    0
  );
  const totalNights = entries.reduce((sum, entry) => sum + entry.nights, 0);
  const averageBookingValue = entries.length > 0 ? totalGrossRevenue / entries.length : 0;

  return (
    <WorkspacePage
      title="Revenue"
      actions={
        <IonButton onClick={() => navigate("/bookings/new")}>
          New Room Booking
        </IonButton>
      }
      notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >
      <div className="metrics-grid">
        <MetricCard label="Bookings" value={String(entries.length)} />
        <MetricCard label="Booked Nights" value={String(totalNights)} />
        <MetricCard label="Gross Revenue" value={formatCurrency(totalGrossRevenue)} tone="success" />
        <MetricCard label="Revenue Costs" value={formatCurrency(totalRevenueCosts)} tone="warning" />
        <MetricCard label="Net Revenue" value={formatCurrency(totalNetRevenue)} tone="success" />
        <MetricCard label="Avg Booking Value" value={formatCurrency(averageBookingValue)} />
      </div>

      <SectionCard
        title="Revenue Ledger"
        subtitle="Every room booking flows here automatically, so there is no separate revenue entry form on this screen anymore."
      >
        {loading ? (
          <div className="centered-state centered-state--small">Loading revenue...</div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Stay</th>
                  <th>Room</th>
                  <th>Nights</th>
                  <th>Gross</th>
                  <th>Costs</th>
                  <th>Net</th>
                  <th>Channel</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.guestName}</strong>
                      <small>{formatDate(entry.stayDate)}</small>
                    </td>
                    <td>{entry.roomNumber}</td>
                    <td>{entry.nights}</td>
                    <td>{formatCurrency(entry.grossRevenue)}</td>
                    <td>{formatCurrency(entry.platformFee + entry.taxAmount + entry.variableCost)}</td>
                    <td>{formatCurrency(entry.netRevenue)}</td>
                    <td>{entry.bookingChannel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </WorkspacePage>
  );
};
