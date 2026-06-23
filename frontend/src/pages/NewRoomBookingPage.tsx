import { IonButton } from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate, today } from "../lib/formatters";
import type { RevenueEntry, Room } from "../types";

interface BookingFormState {
  checkInDate: string;
  checkInTime: string;
  chargeFromDate: string;
  rentUntilDate: string;
  guestName: string;
  mobileNumber: string;
  address: string;
  aadharNumber: string;
  purposeOfStay: string;
  checkingOut: boolean;
  checkoutTime: string;
}

interface SelectedRoomRent {
  roomId: string;
  roomRent: string;
  defaultRent: number;
  rentEditReason: string;
}

const initialForm = (): BookingFormState => ({
  checkInDate: today(),
  checkInTime: "12:00",
  chargeFromDate: today(),
  rentUntilDate: today(),
  guestName: "",
  mobileNumber: "",
  address: "",
  aadharNumber: "",
  purposeOfStay: "",
  checkingOut: false,
  checkoutTime: "12:00"
});

const daysBetweenInclusive = (from: string, to: string) => {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const diff = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1;
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
};

const normalizeAadhar = (value: string) => value.replace(/\D/g, "").slice(0, 12);

export const NewRoomBookingPage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoomRent[]>([]);
  const [form, setForm] = useState<BookingFormState>(initialForm);
  const [lockedGuestEntry, setLockedGuestEntry] = useState<RevenueEntry | null>(null);
  const [isManuallyLinked, setIsManuallyLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [roomsPayload, revenuePayload] = await Promise.all([
          apiRequest<Room[]>("/api/v1/rooms"),
          apiRequest<RevenueEntry[]>("/api/v1/revenue")
        ]);
        setRooms(roomsPayload);
        setRevenueEntries(revenuePayload);

        const firstAvailable = roomsPayload.find((room) => room.status === "AVAILABLE") ?? roomsPayload[0];
        if (firstAvailable) {
          setSelectedRooms([
            {
              roomId: firstAvailable.id,
              roomRent: String(firstAvailable.roomRent),
              defaultRent: firstAvailable.roomRent,
              rentEditReason: ""
            }
          ]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load booking data.");
      } finally {
        setLoading(false);
      }
    };

    void loadBookingData();
  }, [apiRequest]);

  useEffect(() => {
    if (isManuallyLinked) {
      return;
    }

    const occupiedSelection = selectedRooms
      .map((selection) => rooms.find((room) => room.id === selection.roomId))
      .find((room) => room?.status === "OCCUPIED");

    if (!occupiedSelection) {
      setLockedGuestEntry(null);
      return;
    }

    const latestEntry = revenueEntries.find((entry) => entry.roomId === occupiedSelection.id);
    if (!latestEntry) {
      setLockedGuestEntry(null);
      return;
    }

    setLockedGuestEntry(latestEntry);
    setForm((current) => ({
      ...current,
      checkInDate: latestEntry.checkInDate,
      checkInTime: latestEntry.checkInTime,
      chargeFromDate: today(),
      rentUntilDate: today(),
      guestName: latestEntry.guestName,
      mobileNumber: latestEntry.mobileNumber,
      address: latestEntry.address,
      aadharNumber: latestEntry.aadharNumber,
      purposeOfStay: latestEntry.purposeOfStay,
      checkingOut: false
    }));
  }, [isManuallyLinked, revenueEntries, rooms, selectedRooms]);

  useEffect(() => {
    if (lockedGuestEntry) {
      return;
    }
    setForm((current) => ({
      ...current,
      chargeFromDate: current.checkInDate
    }));
  }, [form.checkInDate, lockedGuestEntry]);

  const selectedRoomIds = new Set(selectedRooms.map((room) => room.roomId));
  const rentDays = daysBetweenInclusive(form.chargeFromDate, form.rentUntilDate);
  const selectedRoomDetails = selectedRooms
    .map((selection) => {
      const room = rooms.find((candidate) => candidate.id === selection.roomId);
      return room ? { room, selection } : null;
    })
    .filter(Boolean) as Array<{ room: Room; selection: SelectedRoomRent }>;
  const totalRent = selectedRoomDetails.reduce((sum, item) => sum + Number(item.selection.roomRent || 0) * rentDays, 0);

  const currentOccupiedEntries = useMemo(() => {
    const occupiedRoomIds = new Set(rooms.filter(r => r.status === 'OCCUPIED').map(r => r.id));
    const latestByRoom = new Map<string, RevenueEntry>();
    revenueEntries.forEach(entry => {
      const existing = latestByRoom.get(entry.roomId);
      if (!existing || new Date(entry.createdAt) > new Date(existing.createdAt)) {
        if (occupiedRoomIds.has(entry.roomId) && !entry.checkingOut) {
          latestByRoom.set(entry.roomId, entry);
        }
      }
    });
    return Array.from(latestByRoom.values());
  }, [revenueEntries, rooms]);

  const linkableGuestOptions = useMemo(() => {
    const latestByGroup = new Map<string, RevenueEntry>();
    const roomsByGroup = new Map<string, string[]>();

    currentOccupiedEntries.forEach((entry) => {
      const currentLatest = latestByGroup.get(entry.bookingGroupId);
      if (!currentLatest || new Date(entry.createdAt) > new Date(currentLatest.createdAt)) {
        latestByGroup.set(entry.bookingGroupId, entry);
      }

      const roomNumbers = roomsByGroup.get(entry.bookingGroupId) ?? [];
      if (!roomNumbers.includes(entry.roomNumber)) {
        roomNumbers.push(entry.roomNumber);
      }
      roomsByGroup.set(entry.bookingGroupId, roomNumbers);
    });

    return Array.from(latestByGroup.values()).map((entry) => ({
      entry,
      roomNumbers: roomsByGroup.get(entry.bookingGroupId) ?? [entry.roomNumber]
    }));
  }, [currentOccupiedEntries]);

  const hasOccupiedInSelection = useMemo(() => {
    return selectedRooms.some(selection => {
        const room = rooms.find(r => r.id === selection.roomId);
        return room?.status === 'OCCUPIED';
    });
  }, [rooms, selectedRooms]);

  const handleLinkGuest = (bookingGroupId: string) => {
    const entry = linkableGuestOptions.find(option => option.entry.bookingGroupId === bookingGroupId)?.entry;
    if (!entry) {
      setLockedGuestEntry(null);
      setIsManuallyLinked(false);
      return;
    }

    setLockedGuestEntry(entry);
    setIsManuallyLinked(true);
    setForm(current => ({
      ...current,
      guestName: entry.guestName,
      mobileNumber: entry.mobileNumber,
      address: entry.address,
      aadharNumber: entry.aadharNumber,
      purposeOfStay: entry.purposeOfStay,
      checkInDate: entry.checkInDate,
      checkInTime: entry.checkInTime,
      chargeFromDate: today(),
      rentUntilDate: today()
    }));
  };

  const handleUnlink = () => {
    setLockedGuestEntry(null);
    setIsManuallyLinked(false);
    setForm(initialForm());
  };

  const previousLogs = useMemo(() => {
    if (!lockedGuestEntry) {
      return [];
    }
    return revenueEntries.filter((entry) => entry.aadharNumber === lockedGuestEntry.aadharNumber);
  }, [lockedGuestEntry, revenueEntries]);

  const lockedGuestRoomIds = useMemo(() => {
    if (!lockedGuestEntry) {
      return new Set<string>();
    }

    return new Set(
      revenueEntries
        .filter((entry) => entry.bookingGroupId === lockedGuestEntry.bookingGroupId)
        .map((entry) => entry.roomId)
    );
  }, [lockedGuestEntry, revenueEntries]);

  const toggleRoom = (room: Room, checked: boolean) => {
    if (checked) {
      setSelectedRooms((current) => [
        ...current,
        {
          roomId: room.id,
          roomRent: String(room.roomRent),
          defaultRent: room.roomRent,
          rentEditReason: ""
        }
      ]);
      return;
    }
    setSelectedRooms((current) => current.filter((selection) => selection.roomId !== room.id));
  };

  const updateRoomRent = (roomId: string, patch: Partial<SelectedRoomRent>) => {
    setSelectedRooms((current) =>
      current.map((selection) => (selection.roomId === roomId ? { ...selection, ...patch } : selection))
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return; // Immediate guard

    // Validation: Ensure we are not in a state where we should be linked but aren't
    // or if we are linked, ensure we have a valid groupId
    if (isManuallyLinked && !lockedGuestEntry?.bookingGroupId) {
        setError("Wait for guest data to load or link properly.");
        return;
    }

    setSubmitting(true);
    setError(null);

    if (selectedRooms.length === 0) {
      setError("Select at least one room.");
      setSubmitting(false);
      return;
    }

    const aadharNumber = normalizeAadhar(form.aadharNumber);
    if (aadharNumber.length !== 12) {
      setError("Aadhar number must be exactly 12 digits.");
      setSubmitting(false);
      return;
    }

    const selectedRoomPayload = selectedRooms.map((room) => ({
        roomId: room.roomId,
        roomRent: Number(room.roomRent),
        rentEditReason: room.rentEditReason
      }));

    try {
      const bookingGroupId = lockedGuestEntry?.bookingGroupId;
      await apiRequest("/api/v1/revenue", {
        method: "POST",
        body: JSON.stringify({
          bookingGroupId,
          rooms: selectedRoomPayload,
          checkInDate: form.checkInDate,
          checkInTime: form.checkInTime,
          chargeFromDate: form.chargeFromDate,
          rentUntilDate: form.rentUntilDate,
          guestName: form.guestName,
          mobileNumber: form.mobileNumber,
          address: form.address,
          aadharNumber,
          purposeOfStay: form.purposeOfStay,
          checkingOut: form.checkingOut,
          checkoutTime: form.checkingOut ? form.checkoutTime : null
        })
      });

      navigate("/revenue");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save room booking.");
      setSubmitting(false); // Enable on error
    }
  };

  const visibleRooms = rooms.filter(room => {
      // When manually linking a guest, hide rooms already in that booking group.
      if (isManuallyLinked && lockedGuestRoomIds.has(room.id)) {
          return false;
      }
      return true;
  });

  return (
    <WorkspacePage
      title="New Room Booking"
      description="Create guest rent entries and update selected room status automatically."
      actions={
        <IonButton fill="outline" color="dark" onClick={() => navigate("/revenue")}>
          Back To Revenue
        </IonButton>
      }
      notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >
      <SectionCard title="Guest And Rent Details" subtitle="Occupied rooms reuse guest details; selected rooms control status changes.">
        {loading ? (
          <div className="centered-state centered-state--small">Loading rooms...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
            {!lockedGuestEntry && !hasOccupiedInSelection && linkableGuestOptions.length > 0 && (
              <div className="field">
                <span>Link To Existing Guest (Optional)</span>
                <select onChange={(e) => handleLinkGuest(e.target.value)} defaultValue="">
                  <option value="">-- New Guest / Unlink --</option>
                  {linkableGuestOptions.map(({ entry, roomNumbers }) => (
                    <option key={entry.bookingGroupId} value={entry.bookingGroupId}>
                      Rooms {roomNumbers.join(", ")} - {entry.guestName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isManuallyLinked && lockedGuestEntry && (
              <div className="alert alert--success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Linked to Guest in Room {lockedGuestEntry.roomNumber} (Additional Room Booking)</span>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={handleUnlink}
                >
                  Unlink
                </button>
              </div>
            )}

            {!isManuallyLinked && lockedGuestEntry && hasOccupiedInSelection && (
              <div className="alert alert--warning">
                Extending stay for Room {lockedGuestEntry.roomNumber}.
              </div>
            )}

            <div className="room-rent-selector">
              {visibleRooms.map((room) => {
                const selected = selectedRoomIds.has(room.id);
                const selection = selectedRooms.find((item) => item.roomId === room.id);
                const edited = selection ? Number(selection.roomRent) !== selection.defaultRent : false;
                return (
                  <article key={room.id} className={`room-rent-option ${selected ? "room-rent-option--selected" : ""}`}>
                    <label className="checkbox-field">
                      <input type="checkbox" checked={selected} onChange={(event) => toggleRoom(room, event.target.checked)} />
                      <span>{room.roomNumber} - {room.roomType} ({room.status})</span>
                    </label>
                    {selection ? (
                      <div className="room-rent-option__fields">
                        <label className="field">
                          <span>Room Rent</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={selection.roomRent}
                            onChange={(event) => updateRoomRent(room.id, { roomRent: event.target.value })}
                          />
                        </label>
                        {edited ? (
                          <label className="field">
                            <span>Reason For Rent Edit</span>
                            <input value={selection.rentEditReason} onChange={(event) => updateRoomRent(room.id, { rentEditReason: event.target.value })} />
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="rent-summary">
              {selectedRoomDetails.map(({ room, selection }) => (
                <div key={room.id}>
                  <span>{room.roomNumber}</span>
                  <strong>{formatCurrency(Number(selection.roomRent || 0))} x {rentDays} days</strong>
                </div>
              ))}
              {selectedRoomDetails.length > 1 ? (
                <div>
                  <span>Total Rent</span>
                  <strong>{formatCurrency(totalRent)}</strong>
                </div>
              ) : null}
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Guest Name</span>
                <input readOnly={!!lockedGuestEntry} value={form.guestName} onChange={(event) => setForm({ ...form, guestName: event.target.value })} />
              </label>
              <label className="field">
                <span>Mobile Number</span>
                <input readOnly={!!lockedGuestEntry} value={form.mobileNumber} onChange={(event) => setForm({ ...form, mobileNumber: event.target.value })} />
              </label>
              <label className="field">
                <span>Aadhar Number</span>
                <input
                  readOnly={!!lockedGuestEntry}
                  value={form.aadharNumber}
                  inputMode="numeric"
                  maxLength={12}
                  pattern="\d{12}"
                  title="Enter exactly 12 digits"
                  onChange={(event) => setForm({ ...form, aadharNumber: normalizeAadhar(event.target.value) })}
                />
              </label>
              <label className="field">
                <span>Purpose Of Stay</span>
                <input readOnly={!!lockedGuestEntry} value={form.purposeOfStay} onChange={(event) => setForm({ ...form, purposeOfStay: event.target.value })} />
              </label>
              <label className="field">
                <span>Check-in Date</span>
                <input readOnly={!!lockedGuestEntry} type="date" value={form.checkInDate} onChange={(event) => setForm({ ...form, checkInDate: event.target.value })} />
              </label>
              <label className="field">
                <span>Check-in Time</span>
                <input readOnly={!!lockedGuestEntry} type="time" value={form.checkInTime} onChange={(event) => setForm({ ...form, checkInTime: event.target.value })} />
              </label>
              {lockedGuestEntry && (
                <label className="field">
                  <span>Continuous From Date</span>
                  <input type="date" value={form.chargeFromDate} onChange={(event) => setForm({ ...form, chargeFromDate: event.target.value })} />
                </label>
              )}
              <label className="field">
                <span>{form.checkingOut ? "Checkout Date" : "Rent Until Date"}</span>
                <input type="date" value={form.rentUntilDate} onChange={(event) => setForm({ ...form, rentUntilDate: event.target.value })} />
              </label>
              {form.checkingOut && (
                <label className="field">
                  <span>Checkout Time</span>
                  <input type="time" value={form.checkoutTime} onChange={(event) => setForm({ ...form, checkoutTime: event.target.value })} />
                </label>
              )}
            </div>

            <label className="field">
              <span>Address</span>
              <textarea readOnly={!!lockedGuestEntry} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} rows={3} />
            </label>

            {previousLogs.length > 0 ? (
              <div className="previous-logs">
                <strong>Previous Revenue Logs</strong>
                {previousLogs.map((entry) => (
                  <div key={entry.id}>
                    <span>{entry.roomNumber} - {formatDate(entry.chargeFromDate)} to {formatDate(entry.rentUntilDate)}</span>
                    <strong>{formatCurrency(entry.grossRevenue)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.checkingOut}
                onChange={(event) => setForm({ ...form, checkingOut: event.target.checked })}
              />
              <span>Checking out selected room(s)</span>
            </label>

            <div className="button-row">
              <IonButton type="submit" disabled={submitting || rooms.length === 0 || selectedRooms.length === 0}>
                {submitting ? "Saving..." : "Create Revenue"}
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
