import { IonButton, IonIcon } from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { WorkspacePage } from "../components/WorkspacePage";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { ExpenseEntry } from "../types";

export const ExpensesPage = () => {
  const navigate = useNavigate();
  const { apiRequest } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
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
  }, []);

  return (
    <WorkspacePage
        title="Expenses"
        actions={
          <IonButton onClick={() => navigate("/expenses/new")}>
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

      <SectionCard title="Expense Ledger" subtitle="Spot high-cost vendors and monitor how room-linked costs affect net margin.">
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
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td>{expense.category.replace("_", " ")}</td>
                    <td>{expense.vendorName}</td>
                    <td>{expense.roomNumber ?? "Property"}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </WorkspacePage>
  );
};
