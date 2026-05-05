// --- ENUMS & LITERAL TYPES ---
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATION' | 'WON' | 'LOST';
export type SectorKey = 'TURIZM' | 'KURS' | 'EMLAK' | 'AVTO' | 'DEFAULT';

// --- CORE ENTITIES ---
export interface Organization {
  id: string;
  nameString: string;
  businessSector: SectorKey;
  logoUrl?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  salary?: number;
  bonusAmount?: number;
  status?: string;
  department?: Department;
  organization?: Organization;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  active: boolean;
  createdAt: string;
  organizationId?: string;
}

export interface Lead {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: LeadStatus;
  customer: Customer;
  createdAt: string;
}




export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}


// --- AUTHENTICATION TYPES ---
export interface AuthUser {
  id: string;           // DİQQƏT: Əlavə edildi
  name: string;         // DİQQƏT: Əlavə edildi
  email: string;
  role: string;
  organizationId: string;
  companyName: string;
  businessSector: SectorKey; // DİQQƏT: String deyil, SectorKey olmalıdır
}

export interface AuthResponse {
  token: string;
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  companyName: string;
  businessSector: SectorKey;
}

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// --- DTO & REQUEST TYPES ---
export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
  companyName: string;
  businessSector: SectorKey;
}

export interface ProfileUpdatePayload {
  name: string;
  email: string;
}

export interface PasswordChangePayload {
  oldPassword: string;
  newPassword: string;
}

// --- DASHBOARD & ANALYTICS TYPES ---
export interface DashboardStats {
  totalCustomers: number;
  customerGrowth: number;
  totalLeads: number;
  leadsGrowth: number;
  totalExpectedRevenue: number;
  revenueGrowth: number;
  totalExpense?:number;
  netProfit?:number;
  profitMargin?:number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  customers: number;
  leads: number;
  revenue: number;
}

// --- UTILITY TYPES ---
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  companyName?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  timestamp?: string;
}


export type ExpenseCategory = 'SALARY' | 'MARKETING' | 'RENT' | 'OFFICE' | 'UTILITIES' | 'TAX' | 'OTHER';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  createdAt: string;
  createdByUser?: User;
}