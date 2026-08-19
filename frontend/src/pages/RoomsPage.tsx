import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, archiveOutline, createOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ModalDialog } from "../components/ModalDialog";
import { RoomForm } from "../components/RoomForm";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { Room } from "../types";

export const RoomsPage = () => {
  const { apiRequest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDialogMode, setRoomDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiveRoomId, setArchiveRoomId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<Room[]>("/api/v1/rooms");
      setRooms(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRooms();
  }, []);

  const handleArchive = async () => {
    if (!archiveRoomId) {
      return;
    }

    setArchiving(true);
    try {
      await apiRequest(`/api/v1/rooms/${archiveRoomId}`, {
        method: "DELETE"
      });
      setSuccess("Room archived.");
      setArchiveRoomId(null);
      await loadRooms();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Unable to archive room.");
    } finally {
      setArchiving(false);
    }
  };

  const closeRoomDialog = () => {
    setRoomDialogMode(null);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async (payload: {
    roomNumber: string;
    roomType: string;
    floorNumber: number;
    maxOccupancy: number;
    status: Room["status"];
    roomRent: number;
    notes: string;
  }) => {
    if (roomDialogMode === "edit" && selectedRoom) {
      await apiRequest(`/api/v1/rooms/${selectedRoom.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setSuccess("Room updated.");
    } else {
      await apiRequest("/api/v1/rooms", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess("Room created.");
    }
    closeRoomDialog();
    await loadRooms();
  };

  return (
    <WorkspacePage
        title="Rooms"
        className="rooms-page"
        actions={
          <IonButton onClick={() => setRoomDialogMode("create")}>
            <IonIcon icon={addOutline} slot="start" />
            Add Room
          </IonButton>
        }
        notices={error || success ? (
          <>
            {error ? <div className="alert alert--danger">{error}</div> : null}
            {success ? <div className="alert alert--success">{success}</div> : null}
          </>
        ) : null}
    >

      <SectionCard
        title="Active Inventory"
        subtitle="Use Add Room to create a new room, then manage status, pricing, and availability here."
      >
        {loading ? (
          <div className="centered-state centered-state--small">Loading rooms...</div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Room Rent</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td data-label="Room">
                      <strong>{room.roomNumber}</strong>
                      <small>
                        {room.roomType} - Floor {room.floorNumber} - {room.maxOccupancy} guests
                      </small>
                    </td>
                    <td data-label="Status">
                      <span className={`status-pill status-pill--${room.status.toLowerCase()}`}>{room.status}</span>
                    </td>
                    <td data-label="Room Rent">{formatCurrency(room.roomRent)}</td>
                    <td data-label="Updated">{formatDate(room.updatedAt)}</td>
                    <td className="table-actions" data-label="Actions">
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => {
                          setSelectedRoom(room);
                          setRoomDialogMode("edit");
                        }}
                      >
                        <IonIcon icon={createOutline} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action-button table-action-button--danger"
                        onClick={() => setArchiveRoomId(room.id)}
                      >
                        <IonIcon icon={archiveOutline} aria-hidden="true" />
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <ModalDialog
        isOpen={!!roomDialogMode}
        title={roomDialogMode === "edit" ? "Edit Room" : "Create Room"}
        onClose={closeRoomDialog}
      >
        <RoomForm key={selectedRoom?.id ?? "new-room"} room={selectedRoom} onSubmit={handleSaveRoom} onCancel={closeRoomDialog} />
      </ModalDialog>
      <ConfirmDialog
        isOpen={!!archiveRoomId}
        title="Archive Room"
        message="Archive this room from active inventory?"
        confirmLabel="Archive"
        loading={archiving}
        onCancel={() => {
          if (!archiving) {
            setArchiveRoomId(null);
          }
        }}
        onConfirm={() => void handleArchive()}
      />
    </WorkspacePage>
  );
};
