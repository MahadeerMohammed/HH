import { IonButton } from "@ionic/react";
import { useState } from "react";
import { ROOM_STATUS_OPTIONS, type Room, type RoomStatus } from "../types";

interface RoomFormState {
  roomNumber: string;
  roomType: string;
  floorNumber: string;
  maxOccupancy: string;
  status: RoomStatus;
  roomRent: string;
  notes: string;
}

interface RoomFormProps {
  room?: Room | null;
  onSubmit: (payload: {
    roomNumber: string;
    roomType: string;
    floorNumber: number;
    maxOccupancy: number;
    status: RoomStatus;
    roomRent: number;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const initialFormState = (room?: Room | null): RoomFormState => ({
  roomNumber: room?.roomNumber ?? "",
  roomType: room?.roomType ?? "",
  floorNumber: String(room?.floorNumber ?? 1),
  maxOccupancy: String(room?.maxOccupancy ?? 2),
  status: room?.status ?? "AVAILABLE",
  roomRent: String(room?.roomRent ?? 0),
  notes: room?.notes ?? ""
});

export const RoomForm = ({ room, onSubmit, onCancel }: RoomFormProps) => {
  const [form, setForm] = useState<RoomFormState>(() => initialFormState(room));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!room;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        roomNumber: form.roomNumber,
        roomType: form.roomType,
        floorNumber: Number(form.floorNumber),
        maxOccupancy: Number(form.maxOccupancy),
        status: form.status,
        roomRent: Number(form.roomRent),
        notes: form.notes
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      {error ? <div className="alert alert--danger">{error}</div> : null}
      <div className="form-grid">
        <label className="field">
          <span>Room Number</span>
          <input value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} />
        </label>
        <label className="field">
          <span>Room Type</span>
          <input value={form.roomType} onChange={(event) => setForm({ ...form, roomType: event.target.value })} />
        </label>
        <label className="field">
          <span>Floor</span>
          <input type="number" min="0" value={form.floorNumber} onChange={(event) => setForm({ ...form, floorNumber: event.target.value })} />
        </label>
        <label className="field">
          <span>Max Occupancy</span>
          <input type="number" min="1" value={form.maxOccupancy} onChange={(event) => setForm({ ...form, maxOccupancy: event.target.value })} />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RoomStatus })}>
            {ROOM_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Room Rent</span>
          <input type="number" min="0" step="0.01" value={form.roomRent} onChange={(event) => setForm({ ...form, roomRent: event.target.value })} />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
      </label>

      <div className="button-row">
        <IonButton type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Update Room" : "Create Room"}
        </IonButton>
        <IonButton fill="outline" color="medium" type="button" onClick={onCancel}>
          Cancel
        </IonButton>
      </div>
    </form>
  );
};
