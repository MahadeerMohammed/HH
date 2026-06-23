import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
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

const initialFormState: RoomFormState = {
  roomNumber: "",
  roomType: "",
  floorNumber: "1",
  maxOccupancy: "2",
  status: "AVAILABLE",
  roomRent: "0",
  notes: ""
};

export const NewRoomPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { apiRequest } = useAuth();
  const [form, setForm] = useState<RoomFormState>(initialFormState);
  const [loading, setLoading] = useState(!!editId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;

    const loadRoom = async () => {
      try {
        const rooms = await apiRequest<Room[]>("/api/v1/rooms");
        const room = rooms.find((r) => r.id === editId);
        if (room) {
          setForm({
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            floorNumber: String(room.floorNumber),
            maxOccupancy: String(room.maxOccupancy),
            status: room.status,
            roomRent: String(room.roomRent),
            notes: room.notes ?? ""
          });
        } else {
          setError("Room not found.");
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load room.");
      } finally {
        setLoading(false);
      }
    };

    void loadRoom();
  }, [editId, apiRequest]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      roomNumber: form.roomNumber,
      roomType: form.roomType,
      floorNumber: Number(form.floorNumber),
      maxOccupancy: Number(form.maxOccupancy),
      status: form.status,
      roomRent: Number(form.roomRent),
      notes: form.notes
    };

    try {
      if (editId) {
        await apiRequest(`/api/v1/rooms/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest("/api/v1/rooms", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      navigate("/rooms");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspacePage
      title={editId ? "Edit Room" : "New Room"}
      description={editId ? "Update room details, status, and pricing." : "Add a new room to the hotel inventory."}
      actions={
        <IonButton fill="outline" color="dark" onClick={() => navigate("/rooms")}>
          Back To Rooms
        </IonButton>
      }
      notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >
      <SectionCard
        title={editId ? "Room Details" : "Room Details"}
        subtitle="Admin inventory records feed every revenue and reporting screen."
      >
        {loading ? (
          <div className="centered-state centered-state--small">Loading room...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
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
                <input
                  type="number"
                  min="0"
                  value={form.floorNumber}
                  onChange={(event) => setForm({ ...form, floorNumber: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Max Occupancy</span>
                <input
                  type="number"
                  min="1"
                  value={form.maxOccupancy}
                  onChange={(event) => setForm({ ...form, maxOccupancy: event.target.value })}
                />
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
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.roomRent}
                  onChange={(event) => setForm({ ...form, roomRent: event.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
            </label>

            <div className="button-row">
              <IonButton type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editId ? "Update Room" : "Create Room"}
              </IonButton>
              <IonButton fill="outline" color="medium" type="button" onClick={() => navigate("/rooms")}>
                Cancel
              </IonButton>
            </div>
          </form>
        )}
      </SectionCard>
    </WorkspacePage>
  );
};
