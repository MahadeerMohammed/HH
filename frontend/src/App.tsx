import { IonApp, IonButton, IonContent, IonPage, IonSpinner } from "@ionic/react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { NewExpensePage } from "./pages/NewExpensePage";
import { LoginPage } from "./pages/LoginPage";
import { NewRoomBookingPage } from "./pages/NewRoomBookingPage";
import { ReportsPage } from "./pages/ReportsPage";
import { RevenuePage } from "./pages/RevenuePage";
import { NewRoomPage } from "./pages/NewRoomPage";
import { RoomsPage } from "./pages/RoomsPage";

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="auth-loading">
          <div className="centered-state">
            <IonSpinner name="crescent" />
            <p>Checking your admin session...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
};

const PublicLoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="auth-loading">
          <div className="centered-state">
            <IonSpinner name="crescent" />
            <p>Preparing HotelHub Admin...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

const NotFoundRoute = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent>
        <div className="centered-state">
          <h2>Page not found</h2>
          <IonButton onClick={() => navigate("/dashboard")}>Back to dashboard</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export const App = () => (
  <IonApp>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicLoginRoute />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/new" element={<NewRoomPage />} />
            <Route path="bookings/new" element={<NewRoomBookingPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/new" element={<NewExpensePage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </IonApp>
);
