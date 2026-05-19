import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { today } from "../lib/formatters";
import type { Room } from "../types";

interface BookingFormState {
  roomId: string;
  stayDate: string;
  guestName: string;
  bookingChannel: string;
  nights: string;
  grossRevenue: string;
  platformFee: string;
  taxAmount: string;
  variableCost: string;
  notes: string;
}

const initialForm: BookingFormState = {
  roomId: "",
  stayDate: today(),
  guestName: "",
  bookingChannel: "Direct",
  nights: "1",
  grossRevenue: "0",
  platformFee: "0",
  taxAmount: "0",
  variableCost: "0",
  notes: ""
};

export const NewRoomBookingPage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<BookingFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await apiRequest<Room[]>("/api/v1/rooms");
        setRooms(payload);
        if (payload.length > 0) {
          setForm((current) => ({
            ...current,
            roomId: current.roomId || payload[0].id
          }));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load rooms.");
      } finally {
        setLoading(false);
      }
    };

    void loadRooms();
  }, [apiRequest]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest("/api/v1/revenue", {
        method: "POST",
        body: JSON.stringify({
          roomId: form.roomId,
          stayDate: form.stayDate,
          guestName: form.guestName,
          bookingChannel: form.bookingChannel,
          nights: Number(form.nights),
          grossRevenue: Number(form.grossRevenue),
          platformFee: Number(form.platformFee),
          taxAmount: Number(form.taxAmount),
          variableCost: Number(form.variableCost),
          notes: form.notes
        })
      });

      navigate("/revenue");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save room booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspacePage
      title="New Room Booking"
      description="Create a room booking once, and the Revenue page will calculate and reflect the financial totals automatically."
      actions={
        <IonButton fill="outline" color="dark" onClick={() => navigate("/revenue")}>
          Back To Revenue
        </IonButton>
      }
      notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >
      <SectionCard
        title="Booking Details"
        subtitle="This booking becomes a revenue record and feeds the dashboard, reports, and revenue ledger."
      >
        {loading ? (
          <div className="centered-state centered-state--small">Loading rooms...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Room</span>
                <select value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.roomType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Stay Date</span>
                <input type="date" value={form.stayDate} onChange={(event) => setForm({ ...form, stayDate: event.target.value })} />
              </label>
              <label className="field">
                <span>Guest Name</span>
                <input value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} />
              </label>
              <label className="field">
                <span>Booking Channel</span>
                <input value={form.bookingChannel} onChange={(event) => setForm({ ...form, bookingChannel: event.target.value })} />
              </label>
              <label className="field">
                <span>Nights</span>
                <input type="number" min="1" value={form.nights} onChange={(event) => setForm({ ...form, nights: event.target.value })} />
              </label>
              <label className="field">
                <span>Gross Revenue</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.grossRevenue}
                  onChange={(event) => setForm({ ...form, grossRevenue: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Platform Fee</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.platformFee}
                  onChange={(event) => setForm({ ...form, platformFee: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Tax Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxAmount}
                  onChange={(event) => setForm({ ...form, taxAmount: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Variable Cost</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.variableCost}
                  onChange={(event) => setForm({ ...form, variableCost: event.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
            </label>

            <div className="button-row">
              <IonButton type="submit" disabled={submitting || rooms.length === 0}>
                {submitting ? "Saving..." : "Create Booking"}
              </IonButton>
              <IonButton fill="outline" color="medium" type="button" onClick={() => navigate("/revenue")}>
                Cancel
              </IonButton>
            </div>
          </form>
        )}
      </SectionCard>
    </WorkspacePage>
  );
};
