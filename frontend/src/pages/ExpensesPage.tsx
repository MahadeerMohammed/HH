import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, createOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { ExpenseForm } from "../components/ExpenseForm";
import { ModalDialog } from "../components/ModalDialog";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { ExpenseCategory, ExpenseEntry, Room } from "../types";

export const ExpensesPage = () => {
  const { apiRequest } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [expenseDialogMode, setExpenseDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<ExpenseEntry[]>("/api/v1/expenses");
      setExpenses(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [apiRequest]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const payload = await apiRequest<Room[]>("/api/v1/rooms");
        setRooms(payload);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load rooms.");
      }
    };

    void loadRooms();
  }, [apiRequest]);

  const startEditing = (expense: ExpenseEntry) => {
    setSelectedExpense(expense);
    setExpenseDialogMode("edit");
    setError(null);
    setSuccess(null);
  };

  const closeExpenseDialog = () => {
    setExpenseDialogMode(null);
    setSelectedExpense(null);
  };

  const handleSaveExpense = async (payload: {
    roomId: string | null;
    expenseDate: string;
    category: ExpenseCategory;
    vendorName: string;
    amount: number;
    notes: string;
  }) => {
    setError(null);
    setSuccess(null);

    if (expenseDialogMode === "edit" && selectedExpense) {
      const updatedExpense = await apiRequest<ExpenseEntry>(`/api/v1/expenses/${selectedExpense.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense))
      );
      setSuccess("Expense updated.");
    } else {
      await apiRequest("/api/v1/expenses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSuccess("Expense created.");
      await loadData();
    }
    closeExpenseDialog();
  };

  return (
    <WorkspacePage
        title="Expenses"
        className="expenses-page"
        actions={
          <IonButton onClick={() => setExpenseDialogMode("create")}>
            <IonIcon icon={addOutline} slot="start" />
            Add Expense
          </IonButton>
        }
        notices={error || success ? (
          <>
            {error ? <div className="alert alert--danger">{error}</div> : null}
            {success ? <div className="alert alert--success">{success}</div> : null}
          </>
        ) : null}
    >
      <SectionCard>
        {loading ? (
          <div className="centered-state centered-state--small">Loading expenses...</div>
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td data-label="Date">{formatDate(expense.expenseDate)}</td>
                    <td data-label="Category">{expense.category.replace("_", " ")}</td>
                    <td data-label="Vendor">{expense.vendorName}</td>
                    <td data-label="Room">{expense.roomNumber ?? "Property"}</td>
                    <td data-label="Amount">{formatCurrency(expense.amount)}</td>
                    <td data-label="Actions" className="table-actions">
                      <button type="button" className="table-action-button" onClick={() => startEditing(expense)}>
                        <IonIcon icon={createOutline} aria-hidden="true" />
                        Edit
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
        isOpen={!!expenseDialogMode}
        title={expenseDialogMode === "edit" ? "Edit Expense" : "Create Expense"}
        onClose={closeExpenseDialog}
      >
        <ExpenseForm
          key={selectedExpense?.id ?? "new-expense"}
          expense={selectedExpense}
          rooms={rooms}
          onSubmit={handleSaveExpense}
          onCancel={closeExpenseDialog}
        />
      </ModalDialog>
    </WorkspacePage>
  );
};
