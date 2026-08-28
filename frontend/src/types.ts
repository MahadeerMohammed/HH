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
  importId: string;
  roomNumber: string;
  roomType: string;
  floorNumber: number;
  maxOccupancy: number;
  status: RoomStatus;
  roomRent: number;
  notes: string | null;
  active: boolean;
  updatedAt: string;
}

export type RoomStatus = "AVAILABLE" | "OCCUPIED";

export interface RevenueEntry {
  id: string;
  importId: string;
  bookingGroupId: string;
  roomId: string;
  roomNumber: string;
  checkInDate: string;
  checkInTime: string;
  chargeFromDate: string;
  rentUntilDate: string;
  checkoutDate: string | null;
  checkoutTime: string | null;
  guestName: string;
  mobileNumber: string;
  address: string;
  aadharNumber: string;
  purposeOfStay: string;
  rentDays: number;
  roomRent: number;
  grossRevenue: number;
  rentEditReason: string | null;
  checkingOut: boolean;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  importId: string;
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

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportResult {
  section: string;
  totalRows: number;
  validRows: number;
  importedRows: number;
  errors: ImportError[];
  previewRows: ImportPreviewRow[];
}

export const ROOM_STATUS_OPTIONS: RoomStatus[] = [
  "AVAILABLE",
  "OCCUPIED"
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
