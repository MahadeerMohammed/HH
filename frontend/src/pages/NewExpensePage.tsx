import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { today } from "../lib/formatters";
import { EXPENSE_CATEGORY_OPTIONS, type ExpenseCategory, type Room } from "../types";

interface ExpenseFormState {
  roomId: string;
  expenseDate: string;
  category: ExpenseCategory;
  vendorName: string;
  amount: string;
  notes: string;
}

const initialForm: ExpenseFormState = {
  roomId: "",
  expenseDate: today(),
  category: "HOUSEKEEPING",
  vendorName: "",
  amount: "0",
  notes: ""
};

export const NewExpensePage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<ExpenseFormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const payload = await apiRequest<Room[]>("/api/v1/rooms");
        setRooms(payload);
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
      await apiRequest("/api/v1/expenses", {
        method: "POST",
        body: JSON.stringify({
          roomId: form.roomId || null,
          expenseDate: form.expenseDate,
          category: form.category,
          vendorName: form.vendorName,
          amount: Number(form.amount),
          notes: form.notes
        })
      });
      navigate("/expenses");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WorkspacePage
      title="New Expense"
      description="Record a housekeeping, maintenance, utility, software, or property-level operating cost."
      actions={
        <IonButton fill="outline" color="dark" onClick={() => navigate("/expenses")}>
          Back To Expenses
        </IonButton>
      }
      notices={error ? <div className="alert alert--danger">{error}</div> : null}
    >
      <SectionCard
        title="Expense Details"
        subtitle="Associate expenses to a room where possible so profitability stays granular."
      >
        {loading ? (
          <div className="centered-state centered-state--small">Loading rooms...</div>
        ) : (
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Room (Optional)</span>
                <select value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}>
                  <option value="">Property-level expense</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.roomType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Expense Date</span>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}
                >
                  {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Vendor</span>
                <input value={form.vendorName} onChange={(event) => setForm({ ...form, vendorName: event.target.value })} />
              </label>
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
            </label>

            <div className="button-row">
              <IonButton type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Expense"}
              </IonButton>
              <IonButton fill="outline" color="medium" type="button" onClick={() => navigate("/expenses")}>
                Cancel
              </IonButton>
            </div>
          </form>
        )}
      </SectionCard>
    </WorkspacePage>
  );
};
