import { IonButton } from "@ionic/react";
import { useState } from "react";
import { today } from "../lib/formatters";
import { EXPENSE_CATEGORY_OPTIONS, type ExpenseCategory, type ExpenseEntry, type Room } from "../types";

interface ExpenseFormState {
  roomId: string;
  expenseDate: string;
  category: ExpenseCategory;
  vendorName: string;
  amount: string;
  notes: string;
}

interface ExpenseFormProps {
  expense?: ExpenseEntry | null;
  rooms: Room[];
  onSubmit: (payload: {
    roomId: string | null;
    expenseDate: string;
    category: ExpenseCategory;
    vendorName: string;
    amount: number;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const initialFormState = (expense?: ExpenseEntry | null): ExpenseFormState => ({
  roomId: expense?.roomId ?? "",
  expenseDate: expense?.expenseDate ?? today(),
  category: expense?.category ?? "HOUSEKEEPING",
  vendorName: expense?.vendorName ?? "",
  amount: String(expense?.amount ?? 0),
  notes: expense?.notes ?? ""
});

export const ExpenseForm = ({ expense, rooms, onSubmit, onCancel }: ExpenseFormProps) => {
  const [form, setForm] = useState<ExpenseFormState>(() => initialFormState(expense));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!expense;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        roomId: form.roomId || null,
        expenseDate: form.expenseDate,
        category: form.category,
        vendorName: form.vendorName,
        amount: Number(form.amount),
        notes: form.notes
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      {error ? <div className="alert alert--danger">{error}</div> : null}
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
          <input type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} />
        </label>
        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}>
            {EXPENSE_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Vendor</span>
          <input value={form.vendorName} onChange={(event) => setForm({ ...form, vendorName: event.target.value })} required />
        </label>
        <label className="field">
          <span>Amount</span>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
      </label>

      <div className="button-row">
        <IonButton type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
        </IonButton>
        <IonButton fill="outline" color="medium" type="button" onClick={onCancel}>
          Cancel
        </IonButton>
      </div>
    </form>
  );
};
