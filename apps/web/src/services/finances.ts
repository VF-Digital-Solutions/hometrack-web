import apiClient from "@/lib/api/axios";
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceBudget,
  RecurringExpense,
  AccountType,
  TransactionType,
  FinanceCategoryType,
  BudgetPeriod,
  RecurringFrequency,
} from "@/types";

export interface CreateAccountPayload {
  name: string;
  household_node: string;
  type: AccountType;
  currency?: string;
  initial_balance?: string;
  institution?: string;
  is_shared?: boolean;
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export interface CreateTransactionPayload {
  account: string;
  household_node: string;
  type: TransactionType;
  amount: string;
  description?: string;
  transaction_date: string;
  category?: string | null;
  currency?: string;
  transfer_to_account?: string | null;
  tags?: string[];
}

export interface CreateBudgetPayload {
  name: string;
  household_node: string;
  amount: string;
  period: BudgetPeriod;
  period_start: string;
  category?: string | null;
  currency?: string;
  period_end?: string | null;
  alert_threshold?: number;
}

export type UpdateBudgetPayload = Partial<CreateBudgetPayload>;

export interface CreateCategoryPayload {
  name: string;
  type: FinanceCategoryType;
  household_node?: string | null;
  icon?: string;
  color?: string;
  parent?: string | null;
}

export interface CreateRecurringPayload {
  name: string;
  household_node: string;
  amount: string;
  frequency: RecurringFrequency;
  category?: string | null;
  currency?: string;
  billing_day?: number | null;
  reminder_days_before?: number;
  is_active?: boolean;
}

export type UpdateRecurringPayload = Partial<CreateRecurringPayload>;

export const financeService = {
  // Accounts
  listAccounts: async (householdId?: string): Promise<FinanceAccount[]> => {
    const params = householdId ? { household: householdId } : {};
    const response = await apiClient.get("/finances/accounts/", { params });
    return response.data;
  },
  createAccount: async (payload: CreateAccountPayload): Promise<FinanceAccount> => {
    const response = await apiClient.post("/finances/accounts/", payload);
    return response.data;
  },
  updateAccount: async (id: string, payload: UpdateAccountPayload): Promise<FinanceAccount> => {
    const response = await apiClient.patch(`/finances/accounts/${id}/`, payload);
    return response.data;
  },
  removeAccount: async (id: string): Promise<void> => {
    await apiClient.delete(`/finances/accounts/${id}/`);
  },

  // Categories
  listCategories: async (): Promise<FinanceCategory[]> => {
    const response = await apiClient.get("/finances/categories/");
    return response.data;
  },
  createCategory: async (payload: CreateCategoryPayload): Promise<FinanceCategory> => {
    const response = await apiClient.post("/finances/categories/", payload);
    return response.data;
  },

  // Transactions
  listTransactions: async (accountId?: string): Promise<FinanceTransaction[]> => {
    const params = accountId ? { account: accountId } : {};
    const response = await apiClient.get("/finances/transactions/", { params });
    return response.data;
  },
  createTransaction: async (payload: CreateTransactionPayload): Promise<FinanceTransaction> => {
    const response = await apiClient.post("/finances/transactions/", payload);
    return response.data;
  },
  removeTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/finances/transactions/${id}/`);
  },

  // Budgets
  listBudgets: async (householdId?: string): Promise<FinanceBudget[]> => {
    const params = householdId ? { household: householdId } : {};
    const response = await apiClient.get("/finances/budgets/", { params });
    return response.data;
  },
  createBudget: async (payload: CreateBudgetPayload): Promise<FinanceBudget> => {
    const response = await apiClient.post("/finances/budgets/", payload);
    return response.data;
  },
  updateBudget: async (id: string, payload: UpdateBudgetPayload): Promise<FinanceBudget> => {
    const response = await apiClient.patch(`/finances/budgets/${id}/`, payload);
    return response.data;
  },
  removeBudget: async (id: string): Promise<void> => {
    await apiClient.delete(`/finances/budgets/${id}/`);
  },

  // Recurring expenses
  listRecurring: async (householdId?: string): Promise<RecurringExpense[]> => {
    const params = householdId ? { household: householdId } : {};
    const response = await apiClient.get("/finances/recurring/", { params });
    return response.data;
  },
  createRecurring: async (payload: CreateRecurringPayload): Promise<RecurringExpense> => {
    const response = await apiClient.post("/finances/recurring/", payload);
    return response.data;
  },
  updateRecurring: async (id: string, payload: UpdateRecurringPayload): Promise<RecurringExpense> => {
    const response = await apiClient.patch(`/finances/recurring/${id}/`, payload);
    return response.data;
  },
  removeRecurring: async (id: string): Promise<void> => {
    await apiClient.delete(`/finances/recurring/${id}/`);
  },
};
