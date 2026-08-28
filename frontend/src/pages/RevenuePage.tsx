import { IonButton, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExcelTransferPanel } from "../components/ExcelTransferPanel";
import { FinanceListFilter, type FinanceFilterPeriod } from "../components/FinanceListFilter";
import { MetricCard } from "../components/MetricCard";
import { ModalDialog } from "../components/ModalDialog";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import { NewRoomBookingPage } from "./NewRoomBookingPage";
import type { PagedResponse, RevenueEntry } from "../types";

interface ConsolidatedBooking {
  bookingGroupId: string;
  guestName: string;
  mobileNumber: string;
  rooms: string[];
  totalRevenue: number;
  maxDays: number;
  status: "ACTIVE" | "CHECKED OUT";
  entries: RevenueEntry[];
  lastUpdate: string;
}

const initialPageState = {
  page: 0,
  size: 5,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

export const RevenuePage = () => {
  const { apiRequest } = useAuth();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FinanceFilterPeriod>("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageState, setPageState] = useState(initialPageState);
  const [selectedBooking, setSelectedBooking] = useState<ConsolidatedBooking | null>(null);
  const [bookingDialogMode, setBookingDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingBooking, setEditingBooking] = useState<ConsolidatedBooking | null>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (
    page = pageState.page,
    options?: {
      period?: FinanceFilterPeriod;
      fromDate?: string;
      toDate?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const activePeriod = options?.period ?? filterPeriod;
      const activeFromDate = options?.fromDate ?? fromDate;
      const activeToDate = options?.toDate ?? toDate;
      const params = new URLSearchParams({
        filter: activePeriod,
        page: String(Math.max(page, 0))
      });
      if (activePeriod === "custom") {
        if (activeFromDate) {
          params.set("fromDate", activeFromDate);
        }
        if (activeToDate) {
          params.set("toDate", activeToDate);
        }
      }
      const payload = await apiRequest<PagedResponse<RevenueEntry>>(`/api/v1/revenue/page?${params.toString()}`);
      setEntries(payload.content);
      setPageState({
        page: payload.page,
        size: payload.size,
        totalElements: payload.totalElements,
        totalPages: payload.totalPages,
        first: payload.first,
        last: payload.last
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load revenue.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, filterPeriod, fromDate, pageState.page, toDate]);

  useEffect(() => {
    void loadData(0);
  }, [filterPeriod]);

  const handleApplyFilter = () => {
    void loadData(0);
  };

  const handleResetFilter = () => {
    setFilterPeriod("daily");
    setFromDate("");
    setToDate("");
    setPageState(initialPageState);
    void loadData(0, { period: "daily", fromDate: "", toDate: "" });
  };

  const handlePageChange = (page: number) => {
    void loadData(page);
  };

  const handleDelete = async () => {
    if (!deleteBookingId) {
      return;
    }

    setDeleting(true);
    try {
      await apiRequest(`/api/v1/revenue/${deleteBookingId}`, {
        method: "DELETE"
      });
      setDeleteBookingId(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete revenue.");
    } finally {
      setDeleting(false);
    }
  };

  const closeBookingDialog = () => {
    setBookingDialogMode(null);
    setEditingBooking(null);
  };

  const handleBookingSaved = async () => {
    closeBookingDialog();
    await loadData();
  };

  const consolidatedBookings = entries.reduce<ConsolidatedBooking[]>((acc, entry) => {
    let booking = acc.find((b) => b.bookingGroupId === entry.bookingGroupId);
    if (!booking) {
      booking = {
        bookingGroupId: entry.bookingGroupId,
        guestName: entry.guestName,
        mobileNumber: entry.mobileNumber,
        rooms: [],
        totalRevenue: 0,
        maxDays: 0,
        status: "CHECKED OUT",
        entries: [],
        lastUpdate: entry.createdAt
      };
      acc.push(booking);
    }

    if (!booking.rooms.includes(entry.roomNumber)) {
      booking.rooms.push(entry.roomNumber);
    }
    booking.totalRevenue += entry.grossRevenue;
    booking.maxDays = Math.max(booking.maxDays, entry.rentDays);
    if (!entry.checkingOut) {
      booking.status = "ACTIVE";
    }
    booking.entries.push(entry);
    if (new Date(entry.createdAt) > new Date(booking.lastUpdate)) {
        booking.lastUpdate = entry.createdAt;
    }

    return acc;
  }, []).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());

  const totalGrossRevenue = entries.reduce((sum, entry) => sum + entry.grossRevenue, 0);
  const totalRentDays = entries.reduce((sum, entry) => sum + entry.rentDays, 0);
  const averageBookingValue = consolidatedBookings.length > 0 ? totalGrossRevenue / consolidatedBookings.length : 0;

  return (
    <WorkspacePage
      title="Revenue"
      className="revenue-page"
      actions={
        <>
          <ExcelTransferPanel
            title="Revenue"
            exportPath="/api/v1/revenue/export"
            importPath="/api/v1/revenue/import"
            filenamePrefix="revenue"
            onImported={loadData}
            onError={setError}
            onSuccess={setSuccess}
          />
          <IonButton onClick={() => setBookingDialogMode("create")}>
            New Room Booking
          </IonButton>
        </>
      }
      notices={error || success ? (
        <>
          {error ? <div className="alert alert--danger">{error}</div> : null}
          {success ? <div className="alert alert--success">{success}</div> : null}
        </>
      ) : null}
    >
      <div className="metrics-grid">
        <MetricCard label="Guest Stays" value={String(consolidatedBookings.length)} />
        <MetricCard label="Total Room Days" value={String(totalRentDays)} />
        <MetricCard label="Gross Revenue" value={formatCurrency(totalGrossRevenue)} tone="success" />
        <MetricCard label="Avg Stay Value" value={formatCurrency(averageBookingValue)} />
      </div>

      <SectionCard>
        <FinanceListFilter
          period={filterPeriod}
          fromDate={fromDate}
          toDate={toDate}
          open={filterOpen}
          loading={loading}
          pageState={pageState}
          onPeriodChange={(period) => {
            setFilterPeriod(period);
            setPageState(initialPageState);
          }}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onOpenChange={setFilterOpen}
          onApply={handleApplyFilter}
          onReset={handleResetFilter}
          onPageChange={handlePageChange}
        />
        {loading ? (
          <div className="centered-state centered-state--small">Loading revenue...</div>
        ) : consolidatedBookings.length === 0 ? (
          <div className="centered-state centered-state--small">No revenue records found.</div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Rooms</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {consolidatedBookings.map((booking) => (
                  <tr key={booking.bookingGroupId}>
                    <td data-label="Guest">
                      <strong>{booking.guestName}</strong>
                      <small>{booking.mobileNumber}</small>
                    </td>
                    <td data-label="Rooms">{booking.rooms.join(", ")}</td>
                    <td data-label="Status">
                      <span className={`status-pill ${booking.status === "ACTIVE" ? "status-pill--occupied" : "status-pill--available"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td data-label="Duration">{booking.maxDays} Days</td>
                    <td data-label="Total">
                      <strong>{formatCurrency(booking.totalRevenue)}</strong>
                    </td>
                    <td className="table-actions" data-label="Actions">
                      <button type="button" className="table-action-button" onClick={() => setSelectedBooking(booking)}>
                        View
                      </button>
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => {
                          setEditingBooking(booking);
                          setBookingDialogMode("edit");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action-button table-action-button--danger"
                        onClick={() => setDeleteBookingId(booking.bookingGroupId)}
                      >
                        Delete
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
        isOpen={!!bookingDialogMode}
        title={bookingDialogMode === "edit" ? "Edit Booking" : "Create Booking"}
        onClose={closeBookingDialog}
        size="wide"
      >
        <NewRoomBookingPage
          key={bookingDialogMode === "edit" ? editingBooking?.bookingGroupId : "new-booking"}
          embedded
          editEntries={bookingDialogMode === "edit" ? editingBooking?.entries ?? [] : null}
          onSaved={() => void handleBookingSaved()}
          onCancel={closeBookingDialog}
        />
      </ModalDialog>

      <IonModal isOpen={!!selectedBooking} onDidDismiss={() => setSelectedBooking(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Stay Details - {selectedBooking?.guestName}</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setSelectedBooking(null)}>Close</IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="page-stack">
            <SectionCard title="Guest Information">
              <div className="form-grid">
                <div className="field"><span>Name</span><strong>{selectedBooking?.guestName}</strong></div>
                <div className="field"><span>Mobile</span><strong>{selectedBooking?.mobileNumber}</strong></div>
                <div className="field"><span>Aadhar</span><strong>{selectedBooking?.entries[0]?.aadharNumber}</strong></div>
                <div className="field"><span>Check-in</span><strong>{formatDate(selectedBooking?.entries[0]?.checkInDate ?? "")} {selectedBooking?.entries[0]?.checkInTime}</strong></div>
              </div>
              <div className="field" style={{ marginTop: '1rem' }}>
                <span>Address</span>
                <p style={{ margin: 0 }}>{selectedBooking?.entries[0]?.address}</p>
              </div>
            </SectionCard>

            <SectionCard title="Room Breakdown">
              <div className="table-shell">
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Period</th>
                      <th>Days</th>
                      <th>Rent</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBooking?.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td data-label="Room">
                          <div className="room-detail-line">
                            <strong>{entry.roomNumber}</strong>
                            {selectedBooking.entries.length > 1 && entry.checkingOut ? (
                              <span className="status-pill status-pill--available status-pill--compact">
                                Checked Out
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="Period">
                          {formatDate(entry.chargeFromDate)} to {formatDate(entry.rentUntilDate)}
                        </td>
                        <td data-label="Days">{entry.rentDays}</td>
                        <td data-label="Rent">{formatCurrency(entry.roomRent)}</td>
                        <td data-label="Subtotal">{formatCurrency(entry.grossRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '1rem' }}><strong>Grand Total</strong></td>
                      <td style={{ padding: '1rem' }}><strong>{formatCurrency(selectedBooking?.totalRevenue ?? 0)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </SectionCard>
          </div>
        </IonContent>
      </IonModal>
      <ConfirmDialog
        isOpen={!!deleteBookingId}
        title="Delete Booking"
        message="Permanently delete this booking group? This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteBookingId(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </WorkspacePage>
  );
};
