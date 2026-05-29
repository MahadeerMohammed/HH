import { IonButton, IonIcon } from "@ionic/react";
import {
  addCircleOutline,
  analyticsOutline,
  bedOutline,
  cashOutline,
  documentTextOutline,
  logOutOutline,
  pieChartOutline
} from "ionicons/icons";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: analyticsOutline },
  { to: "/rooms", label: "Rooms", icon: bedOutline },
  { to: "/revenue", label: "Revenue", icon: cashOutline },
  { to: "/expenses", label: "Expenses", icon: pieChartOutline },
  { to: "/reports", label: "Reports", icon: documentTextOutline }
];

const pageItems = [
  ...navigationItems,
  { to: "/bookings/new", label: "New Room Booking", icon: addCircleOutline }
];

export const AppShell = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <div className="brand-lockup__mark">H</div>
          <div>
            <strong>HotelHub</strong>
            <p>Admin command center</p>
          </div>
        </div>

        <nav className="app-nav" role="navigation" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "app-nav__item app-nav__item--active" : "app-nav__item")}
              role="menuitem"
              aria-current={location.pathname === item.to ? "page" : undefined}
            >
              <IonIcon icon={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Restricted admin access</p>
          <small>{user?.email}</small>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar" role="banner">
          <div className="topbar__identity">
            <span>{user?.fullName}</span>
            <small>{user?.role}</small>
          </div>
          <div className="topbar__actions">
            <IonButton 
              fill="outline" 
              color="dark" 
              onClick={() => void signOut()}
              aria-label="Sign out from admin dashboard"
              className="logout-button"
            >
              <IonIcon icon={logOutOutline} slot="start" aria-hidden="true" />
              <span>Logout</span>
            </IonButton>
          </div>
        </header>

        <main className="page-body" role="main">
          <Outlet />
        </main>

        <nav className="mobile-tabbar" role="navigation" aria-label="Mobile navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "mobile-tabbar__item mobile-tabbar__item--active" : "mobile-tabbar__item")}
              role="menuitem"
              aria-current={location.pathname === item.to ? "page" : undefined}
              title={item.label}
            >
              <IonIcon icon={item.icon} aria-hidden="true" />
              <span aria-label={item.label}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
