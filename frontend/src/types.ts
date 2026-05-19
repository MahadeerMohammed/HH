export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserProfile;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floorNumber: number;
  maxOccupancy: number;
  status: RoomStatus;
  baseRate: number;
  notes: string | null;
  active: boolean;
  updatedAt: string;
}

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "BLOCKED";

export interface RevenueEntry {
  id: string;
  roomId: string;
  roomNumber: string;
  stayDate: string;
  guestName: string;
  bookingChannel: string;
  nights: number;
  grossRevenue: number;
  platformFee: number;
  taxAmount: number;
  variableCost: number;
  netRevenue: number;
  notes: string | null;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  roomId: string | null;
  roomNumber: string | null;
  expenseDate: string;
  category: ExpenseCategory;
  vendorName: string;
  amount: number;
  notes: string | null;
  createdAt: string;
}

export type ExpenseCategory =
  | "HOUSEKEEPING"
  | "MAINTENANCE"
  | "UTILITIES"
  | "PAYROLL"
  | "SOFTWARE"
  | "MARKETING"
  | "TAX"
  | "OTHER";

export interface TrendPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface DashboardSummary {
  fromDate: string;
  toDate: string;
  grossRevenue: number;
  operatingExpenses: number;
  revenueCosts: number;
  netProfit: number;
  activeRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  trend: TrendPoint[];
}

export interface RoomPerformance {
  roomId: string;
  roomNumber: string;
  roomType: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ReportResponse {
  fromDate: string;
  toDate: string;
  grossRevenue: number;
  operatingExpenses: number;
  revenueCosts: number;
  netProfit: number;
  occupancyRate: number;
  roomPerformance: RoomPerformance[];
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: string[];
}

export const ROOM_STATUS_OPTIONS: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "CLEANING",
  "MAINTENANCE",
  "BLOCKED"
];

export const EXPENSE_CATEGORY_OPTIONS: ExpenseCategory[] = [
  "HOUSEKEEPING",
  "MAINTENANCE",
  "UTILITIES",
  "PAYROLL",
  "SOFTWARE",
  "MARKETING",
  "TAX",
  "OTHER"
];
