import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, createOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { ExcelTransferPanel } from "../components/ExcelTransferPanel";
import { ExpenseForm } from "../components/ExpenseForm";
import { FinanceListFilter, type FinanceFilterPeriod } from "../components/FinanceListFilter";
import { ModalDialog } from "../components/ModalDialog";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { ExpenseCategory, ExpenseEntry, PagedResponse, Room } from "../types";

const initialPageState = {
  page: 0,
  size: 5,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

export const ExpensesPage = () => {
  const { apiRequest } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FinanceFilterPeriod>("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageState, setPageState] = useState(initialPageState);
  const [expenseDialogMode, setExpenseDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(null);
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
      const payload = await apiRequest<PagedResponse<ExpenseEntry>>(`/api/v1/expenses/page?${params.toString()}`);
      setExpenses(payload.content);
      setPageState({
        page: payload.page,
        size: payload.size,
        totalElements: payload.totalElements,
        totalPages: payload.totalPages,
        first: payload.first,
        last: payload.last
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, filterPeriod, fromDate, pageState.page, toDate]);

  useEffect(() => {
    void loadData(0);
  }, [filterPeriod]);

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
          <>
            <ExcelTransferPanel
              title="Expenses"
              exportPath="/api/v1/expenses/export"
              importPath="/api/v1/expenses/import"
              filenamePrefix="expenses"
              onImported={loadData}
              onError={setError}
              onSuccess={setSuccess}
            />
            <IonButton onClick={() => setExpenseDialogMode("create")}>
              <IonIcon icon={addOutline} slot="start" />
              Add Expense
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
          <div className="centered-state centered-state--small">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="centered-state centered-state--small">No expenses found.</div>
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
