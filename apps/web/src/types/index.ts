export type HouseholdType = "INDIVIDUAL" | "FAMILY" | "COMMUNITY";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface HouseholdNode {
  id: string;
  name: string;
  description: string;
  type: HouseholdType;
  parent: string | null;
  avatar_url: string | null;
  address: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMemberUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface HouseholdMembership {
  id: string;
  user: HouseholdMemberUser;
  node: string;
  role: MemberRole;
  nickname: string | null;
  joined_at: string;
  left_at: string | null;
}

export interface HouseholdInvitation {
  id: string;
  node: string;
  invited_email: string;
  role: MemberRole;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

// ── Finances ──────────────────────────────────────────────────────────────────

export type AccountType = "CASH" | "BANK" | "SAVINGS" | "INVESTMENT" | "CREDIT" | "OTHER";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type FinanceCategoryType = "INCOME" | "EXPENSE";
export type BudgetPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
export type RecurringFrequency = "MONTHLY" | "ANNUAL" | "WEEKLY" | "OTHER";

export interface FinanceAccount {
  id: string;
  household_node: string;
  name: string;
  type: AccountType;
  currency: string;
  initial_balance: string;
  current_balance: string;
  institution: string;
  is_shared: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  household_node: string | null;
  name: string;
  type: FinanceCategoryType;
  icon: string;
  color: string;
  parent: string | null;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  account: string;
  household_node: string;
  created_by: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  category: string | null;
  description: string;
  transaction_date: string;
  is_recurring: boolean;
  tags: string[];
  receipt_url: string | null;
  transfer_to_account: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceBudget {
  id: string;
  household_node: string;
  category: string | null;
  name: string;
  amount: string;
  currency: string;
  period: BudgetPeriod;
  period_start: string;
  period_end: string | null;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  household_node: string;
  category: string | null;
  name: string;
  amount: string;
  currency: string;
  billing_day: number | null;
  frequency: RecurringFrequency;
  reminder_days_before: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Assets ────────────────────────────────────────────────────────────────────

export type AssetStatus = "ACTIVE" | "IN_REPAIR" | "INACTIVE" | "DISPOSED";
export type MaintenanceType = "PREVENTIVE" | "CORRECTIVE" | "INSPECTION" | "CLEANING";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type DocumentType = "INVOICE" | "MANUAL" | "WARRANTY" | "PHOTO" | "OTHER";

export interface AssetCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  parent: number | null;
  attribute_schema: Record<string, unknown>;
}

export interface Asset {
  id: string;
  household_node: string;
  name: string;
  description: string;
  category: number | null;
  category_name: string | null;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string | null;
  purchase_price: string | null;
  warranty_expiry: string | null;
  location_in_home: string;
  status: AssetStatus;
  attributes: Record<string, unknown>;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetDocument {
  id: string;
  asset: string;
  uploaded_by: string | null;
  name: string;
  type: DocumentType;
  file_url: string | null;
  file_size: number | null;
  mime_type: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  asset: string;
  title: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_at: string;
  completed_at: string | null;
  cost: string | null;
  currency: string;
  provider_name: string;
  provider_contact: string;
  notes: string;
  performed_by: string | null;
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  label: string;
  required?: boolean;
}

export interface MaintenanceTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  suggested_interval_days: number | null;
  checklist: ChecklistItem[];
}

// ── Routines & Habits ─────────────────────────────────────────────────────────

export type HabitCategory = "HEALTH" | "FITNESS" | "LEARNING" | "HOME" | "FINANCE" | "CUSTOM";
export type HabitFrequency = "DAILY" | "WEEKLY" | "CUSTOM";
export type HabitVisibility = "PRIVATE" | "HOUSEHOLD";
export type HabitLogStatus = "COMPLETED" | "SKIPPED" | "PARTIAL";
export type RoutineCategory = "CLEANING" | "MAINTENANCE" | "SHOPPING" | "COOKING" | "CUSTOM";
export type RoutineRecurrence = "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
export type OccurrenceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export interface Habit {
  id: string;
  user: string;
  household_node: string | null;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: HabitCategory;
  visibility: HabitVisibility;
  frequency_type: HabitFrequency;
  frequency_config: Record<string, unknown>;
  target_value: string | null;
  target_unit: string;
  reminder_time: string | null;
  start_date: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitStreak {
  id: string;
  habit: string;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  total_completions: number;
  updated_at: string;
}

export interface HouseholdRoutine {
  id: string;
  household_node: string;
  created_by: string | null;
  title: string;
  description: string;
  category: RoutineCategory;
  recurrence_type: RoutineRecurrence;
  recurrence_config: Record<string, unknown>;
  estimated_duration_minutes: number | null;
  is_rotative: boolean;
  assignees: string[];
  linked_asset: string | null;
  created_at: string;
  updated_at: string;
}

export interface HouseholdRoutineOccurrence {
  id: string;
  routine: string;
  assigned_to: string | null;
  due_at: string;
  status: OccurrenceStatus;
  completed_at: string | null;
  completed_by: string | null;
  notes: string;
  proof_image_url: string | null;
  created_at: string;
}
