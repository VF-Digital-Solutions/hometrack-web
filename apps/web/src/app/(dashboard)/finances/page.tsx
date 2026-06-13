"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceBudget,
  RecurringExpense,
  AccountType,
  TransactionType,
  BudgetPeriod,
  RecurringFrequency,
  HouseholdNode,
} from "@/types";
import { financeService } from "@/services/finances";
import { householdService } from "@/services/households";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Efectivo", BANK: "Banco", SAVINGS: "Ahorros",
  INVESTMENT: "Inversión", CREDIT: "Crédito", OTHER: "Otro",
};

const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  MONTHLY: "Mensual", QUARTERLY: "Trimestral", ANNUAL: "Anual", CUSTOM: "Personalizado",
};

const RECURRING_FREQ_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: "Mensual", ANNUAL: "Anual", WEEKLY: "Semanal", OTHER: "Otro",
};

function formatCurrency(amount: string, currency = "CLP") {
  return `${currency} ${parseFloat(amount).toLocaleString("es-CL", { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CL");
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function currentMonthTransactions(txs: FinanceTransaction[]) {
  const now = new Date();
  return txs.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

// ── Shared modal shell ────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#EAE6DD] font-semibold mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-red-400 text-xs mt-1">{msg}</p> : null;
}

const inputCls = "w-full appearance-none bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] placeholder-[#5A6A5A] focus:outline-none focus:border-[#C8A96B] transition-colors";
const labelCls = "block text-[#5A6A5A] text-xs uppercase tracking-wider mb-1.5";

function ModalActions({ loading, onClose, submitLabel }: { loading: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">Cancelar</button>
      <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#0D0D0D] bg-[#C8A96B] rounded-md hover:bg-[#b8995b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Guardando..." : submitLabel}</button>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ label, onConfirm, onClose }: { label: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); } catch { setError("No se pudo eliminar."); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-[#EAE6DD] font-semibold mb-2">Eliminar</h2>
        <p className="text-[#5A6A5A] text-sm mb-5">¿Estás seguro que quieres eliminar <span className="text-[#EAE6DD]">{label}</span>?</p>
        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handle} disabled={loading} className="flex-1 px-4 py-2 text-sm text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors font-medium disabled:opacity-50">{loading ? "Eliminando..." : "Eliminar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Account modals ────────────────────────────────────────────────────────────

const accountSchema = z.object({
  name: z.string().min(1, "Requerido"),
  household_node: z.string().min(1, "Requerido"),
  type: z.enum(["CASH", "BANK", "SAVINGS", "INVESTMENT", "CREDIT", "OTHER"]),
  currency: z.string().optional(),
  initial_balance: z.string().optional(),
  institution: z.string().optional(),
  is_shared: z.boolean().optional(),
});
type AccountForm = z.infer<typeof accountSchema>;

function AccountModal({
  title, defaultValues, households, onSave, onClose,
}: {
  title: string;
  defaultValues?: Partial<AccountForm>;
  households: HouseholdNode[];
  onSave: (data: AccountForm) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { currency: "CLP", initial_balance: "0", is_shared: false, type: "BANK", ...defaultValues },
  });
  const onSubmit = async (data: AccountForm) => {
    setLoading(true); setError(null);
    try { await onSave(data); }
    catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else setError("Error al guardar la cuenta.");
    } finally { setLoading(false); }
  };
  return (
    <ModalShell title={title} onClose={onClose}>
      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre *</label>
            <input {...register("name")} type="text" placeholder="Ej. Cuenta corriente" className={inputCls} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div>
            <label className={labelCls}>Hogar *</label>
            <select {...register("household_node")} className={inputCls}>
              <option value="">Seleccionar hogar</option>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <FieldError msg={errors.household_node?.message} />
          </div>
          <div>
            <label className={labelCls}>Tipo *</label>
            <select {...register("type")} className={inputCls}>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <input {...register("currency")} type="text" placeholder="CLP" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Saldo inicial</label>
            <input {...register("initial_balance")} type="number" step="0.01" min="0" placeholder="0" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Institución</label>
            <input {...register("institution")} type="text" placeholder="Ej. Banco Estado" className={inputCls} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <input {...register("is_shared")} id="is_shared" type="checkbox" className="w-4 h-4 accent-[#C8A96B]" />
            <label htmlFor="is_shared" className="text-[#EAE6DD] text-sm">Cuenta compartida con el hogar</label>
          </div>
        </div>
        <ModalActions loading={loading} onClose={onClose} submitLabel={title} />
      </form>
    </ModalShell>
  );
}

// ── Transaction modal ─────────────────────────────────────────────────────────

const txSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  account: z.string().min(1, "Requerido"),
  household_node: z.string().min(1, "Requerido"),
  amount: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  transaction_date: z.string().min(1, "Requerido"),
  category: z.string().optional(),
  currency: z.string().optional(),
  transfer_to_account: z.string().optional(),
});
type TxForm = z.infer<typeof txSchema>;

function TransactionModal({
  accounts, categories, households, onSave, onClose,
}: {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  households: HouseholdNode[];
  onSave: (data: TxForm) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<TxForm>({
    resolver: zodResolver(txSchema),
    defaultValues: { type: "EXPENSE", transaction_date: todayStr(), currency: "CLP" },
  });
  const txType = watch("type");
  const onSubmit = async (data: TxForm) => {
    setLoading(true); setError(null);
    try { await onSave(data); }
    catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else setError("Error al crear la transacción.");
    } finally { setLoading(false); }
  };
  const filteredCategories = categories.filter((c) =>
    txType === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
  );
  return (
    <ModalShell title="Nueva transacción" onClose={onClose}>
      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tipo *</label>
            <select {...register("type")} className={inputCls}>
              <option value="EXPENSE">Gasto</option>
              <option value="INCOME">Ingreso</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Monto *</label>
            <input {...register("amount")} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
            <FieldError msg={errors.amount?.message} />
          </div>
          <div>
            <label className={labelCls}>Cuenta *</label>
            <select {...register("account")} className={inputCls}>
              <option value="">Seleccionar cuenta</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <FieldError msg={errors.account?.message} />
          </div>
          <div>
            <label className={labelCls}>Hogar *</label>
            <select {...register("household_node")} className={inputCls}>
              <option value="">Seleccionar hogar</option>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <FieldError msg={errors.household_node?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Fecha *</label>
            <input {...register("transaction_date")} type="date" className={inputCls} />
            <FieldError msg={errors.transaction_date?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Descripción</label>
            <input {...register("description")} type="text" placeholder="Descripción opcional" className={inputCls} />
          </div>
          {txType !== "TRANSFER" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Categoría</label>
              <select {...register("category")} className={inputCls}>
                <option value="">Sin categoría</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {txType === "TRANSFER" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Cuenta destino</label>
              <select {...register("transfer_to_account")} className={inputCls}>
                <option value="">Seleccionar cuenta destino</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Moneda</label>
            <input {...register("currency")} type="text" placeholder="CLP" className={inputCls} />
          </div>
        </div>
        <ModalActions loading={loading} onClose={onClose} submitLabel="Crear transacción" />
      </form>
    </ModalShell>
  );
}

// ── Budget modals ─────────────────────────────────────────────────────────────

const budgetSchema = z.object({
  name: z.string().min(1, "Requerido"),
  household_node: z.string().min(1, "Requerido"),
  amount: z.string().min(1, "Requerido"),
  period: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]),
  period_start: z.string().min(1, "Requerido"),
  period_end: z.string().optional(),
  category: z.string().optional(),
  currency: z.string().optional(),
  alert_threshold: z.string().optional(),
});
type BudgetForm = z.infer<typeof budgetSchema>;

function BudgetModal({
  title, defaultValues, households, categories, onSave, onClose,
}: {
  title: string;
  defaultValues?: Partial<BudgetForm>;
  households: HouseholdNode[];
  categories: FinanceCategory[];
  onSave: (data: BudgetForm) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { period: "MONTHLY", currency: "CLP", alert_threshold: "80", period_start: todayStr(), ...defaultValues },
  });
  const onSubmit = async (data: BudgetForm) => {
    setLoading(true); setError(null);
    try { await onSave(data); }
    catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else setError("Error al guardar el presupuesto.");
    } finally { setLoading(false); }
  };
  return (
    <ModalShell title={title} onClose={onClose}>
      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre *</label>
            <input {...register("name")} type="text" placeholder="Ej. Gastos del mes" className={inputCls} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div>
            <label className={labelCls}>Hogar *</label>
            <select {...register("household_node")} className={inputCls}>
              <option value="">Seleccionar hogar</option>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <FieldError msg={errors.household_node?.message} />
          </div>
          <div>
            <label className={labelCls}>Período *</label>
            <select {...register("period")} className={inputCls}>
              {Object.entries(BUDGET_PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Monto límite *</label>
            <input {...register("amount")} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
            <FieldError msg={errors.amount?.message} />
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <input {...register("currency")} type="text" placeholder="CLP" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Fecha inicio *</label>
            <input {...register("period_start")} type="date" className={inputCls} />
            <FieldError msg={errors.period_start?.message} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Fecha fin</label>
            <input {...register("period_end")} type="date" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Categoría</label>
            <select {...register("category")} className={inputCls}>
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Umbral de alerta (%)</label>
            <input {...register("alert_threshold")} type="number" min="0" max="100" placeholder="80" className={inputCls} />
          </div>
        </div>
        <ModalActions loading={loading} onClose={onClose} submitLabel={title} />
      </form>
    </ModalShell>
  );
}

// ── Recurring modals ──────────────────────────────────────────────────────────

const recurringSchema = z.object({
  name: z.string().min(1, "Requerido"),
  household_node: z.string().min(1, "Requerido"),
  amount: z.string().min(1, "Requerido"),
  frequency: z.enum(["MONTHLY", "ANNUAL", "WEEKLY", "OTHER"]),
  category: z.string().optional(),
  currency: z.string().optional(),
  billing_day: z.string().optional(),
  reminder_days_before: z.string().optional(),
});
type RecurringForm = z.infer<typeof recurringSchema>;

function RecurringModal({
  title, defaultValues, households, categories, onSave, onClose,
}: {
  title: string;
  defaultValues?: Partial<RecurringForm>;
  households: HouseholdNode[];
  categories: FinanceCategory[];
  onSave: (data: RecurringForm) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { frequency: "MONTHLY", currency: "CLP", reminder_days_before: "3", ...defaultValues },
  });
  const onSubmit = async (data: RecurringForm) => {
    setLoading(true); setError(null);
    try { await onSave(data); }
    catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) setError(err.response.data.detail);
      else setError("Error al guardar el gasto recurrente.");
    } finally { setLoading(false); }
  };
  return (
    <ModalShell title={title} onClose={onClose}>
      {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre *</label>
            <input {...register("name")} type="text" placeholder="Ej. Netflix" className={inputCls} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div>
            <label className={labelCls}>Hogar *</label>
            <select {...register("household_node")} className={inputCls}>
              <option value="">Seleccionar hogar</option>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <FieldError msg={errors.household_node?.message} />
          </div>
          <div>
            <label className={labelCls}>Frecuencia *</label>
            <select {...register("frequency")} className={inputCls}>
              {Object.entries(RECURRING_FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Monto *</label>
            <input {...register("amount")} type="number" step="0.01" min="0" placeholder="0.00" className={inputCls} />
            <FieldError msg={errors.amount?.message} />
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <input {...register("currency")} type="text" placeholder="CLP" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Día de facturación</label>
            <input {...register("billing_day")} type="number" min="1" max="31" placeholder="15" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Recordatorio (días antes)</label>
            <input {...register("reminder_days_before")} type="number" min="0" placeholder="3" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Categoría</label>
            <select {...register("category")} className={inputCls}>
              <option value="">Sin categoría</option>
              {categories.filter((c) => c.type === "EXPENSE").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <ModalActions loading={loading} onClose={onClose} submitLabel={title} />
      </form>
    </ModalShell>
  );
}

// ── Tab: Cuentas ──────────────────────────────────────────────────────────────

function AccountCard({ account, onEdit, onDelete }: { account: FinanceAccount; onEdit: () => void; onDelete: () => void }) {
  const balance = parseFloat(account.current_balance);
  const positive = balance >= 0;
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[#EAE6DD] font-medium text-sm">{account.name}</p>
          {account.institution && <p className="text-[#5A6A5A] text-xs mt-0.5">{account.institution}</p>}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border text-[#C8A96B] bg-[#C8A96B]/10 border-[#C8A96B]/30">
          {ACCOUNT_TYPE_LABELS[account.type]}
        </span>
      </div>
      <p className={`text-xl font-semibold mb-4 ${positive ? "text-green-400" : "text-red-400"}`}>
        {formatCurrency(account.current_balance, account.currency)}
      </p>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 px-3 py-1.5 text-xs text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors">Editar</button>
        <button onClick={onDelete} className="flex-1 px-3 py-1.5 text-xs text-red-400 border border-red-900/30 rounded-md hover:bg-red-900/10 transition-colors">Eliminar</button>
      </div>
    </div>
  );
}

function AccountsTab({
  accounts, households, categories, transactions,
  onAccountCreated, onAccountUpdated, onAccountDeleted,
}: {
  accounts: FinanceAccount[];
  households: HouseholdNode[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  onAccountCreated: (a: FinanceAccount) => void;
  onAccountUpdated: (a: FinanceAccount) => void;
  onAccountDeleted: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; account?: FinanceAccount } | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);
  const monthTxs = currentMonthTransactions(transactions);
  const monthIncome = monthTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + parseFloat(t.amount), 0);
  const monthExpense = monthTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Balance total", value: `CLP ${totalBalance.toLocaleString("es-CL")}`, color: totalBalance >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Ingresos del mes", value: `CLP ${monthIncome.toLocaleString("es-CL")}`, color: "text-green-400" },
          { label: "Gastos del mes", value: `CLP ${monthExpense.toLocaleString("es-CL")}`, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
            <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#EAE6DD] font-medium text-sm">Mis cuentas ({accounts.length})</h3>
        <button onClick={() => setModal({ type: "create" })} className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors">Nueva cuenta</button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-[#5A6A5A] text-sm">No hay cuentas registradas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={() => setModal({ type: "edit", account: a })}
              onDelete={() => setModal({ type: "delete", account: a })}
            />
          ))}
        </div>
      )}

      {modal?.type === "create" && (
        <AccountModal
          title="Nueva cuenta"
          households={households}
          onSave={async (data) => {
            const created = await financeService.createAccount({ ...data, currency: data.currency || "CLP", initial_balance: data.initial_balance || "0" });
            onAccountCreated(created);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && modal.account && (
        <AccountModal
          title="Editar cuenta"
          households={households}
          defaultValues={{ name: modal.account.name, household_node: modal.account.household_node, type: modal.account.type, currency: modal.account.currency, institution: modal.account.institution, is_shared: modal.account.is_shared }}
          onSave={async (data) => {
            const updated = await financeService.updateAccount(modal.account!.id, data);
            onAccountUpdated(updated);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && modal.account && (
        <DeleteModal
          label={modal.account.name}
          onConfirm={async () => { await financeService.removeAccount(modal.account!.id); onAccountDeleted(modal.account!.id); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Tab: Transacciones ────────────────────────────────────────────────────────

function TransactionsTab({
  transactions, accounts, categories, households,
  onCreated, onDeleted,
}: {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  households: HouseholdNode[];
  onCreated: (t: FinanceTransaction) => void;
  onDeleted: (id: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = filter ? transactions.filter((t) => t.account === filter) : transactions;

  const handleFilter = async (accountId: string) => {
    setFilter(accountId);
    setLoading(true);
    try {
      const txs = await financeService.listTransactions(accountId || undefined);
      onCreated(txs as unknown as FinanceTransaction); // reuse via parent reset
    } catch { /* silently ignore */ } finally { setLoading(false); }
  };

  const TX_COLORS: Record<TransactionType, string> = {
    INCOME: "text-green-400", EXPENSE: "text-red-400", TRANSFER: "text-blue-400",
  };
  const TX_LABELS: Record<TransactionType, string> = {
    INCOME: "Ingreso", EXPENSE: "Gasto", TRANSFER: "Transferencia",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[#111111] border border-[#2A2A2A] rounded-md px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] transition-colors">
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors">Nueva transacción</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-[#5A6A5A] text-sm">No hay transacciones.</p>
      ) : (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg divide-y divide-[#1E1E1E]">
          {filtered.map((t) => {
            const account = accounts.find((a) => a.id === t.account);
            const category = categories.find((c) => c.id === t.category);
            return (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-[#EAE6DD] text-sm truncate">{t.description || TX_LABELS[t.type]}</p>
                  <p className="text-[#5A6A5A] text-xs">
                    {formatDate(t.transaction_date)}
                    {account && ` · ${account.name}`}
                    {category && ` · ${category.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className={`text-sm font-medium ${TX_COLORS[t.type]}`}>
                    {t.type === "EXPENSE" ? "-" : "+"}{formatCurrency(t.amount, t.currency)}
                  </p>
                  {deletingId === t.id ? (
                    <div className="flex gap-1">
                      <button onClick={async () => { await financeService.removeTransaction(t.id); onDeleted(t.id); setDeletingId(null); }} className="text-xs text-red-400 hover:underline">Confirmar</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs text-[#5A6A5A] hover:underline ml-1">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(t.id)} className="text-[#5A6A5A] hover:text-red-400 transition-colors text-xs">✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TransactionModal
          accounts={accounts}
          categories={categories}
          households={households}
          onSave={async (data) => {
            const created = await financeService.createTransaction({
              ...data,
              currency: data.currency || "CLP",
              transfer_to_account: data.transfer_to_account || null,
              category: data.category || null,
            });
            onCreated(created);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── Tab: Presupuestos ─────────────────────────────────────────────────────────

function BudgetsTab({
  budgets, households, categories, onCreated, onUpdated, onDeleted,
}: {
  budgets: FinanceBudget[];
  households: HouseholdNode[];
  categories: FinanceCategory[];
  onCreated: (b: FinanceBudget) => void;
  onUpdated: (b: FinanceBudget) => void;
  onDeleted: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; budget?: FinanceBudget } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#EAE6DD] font-medium text-sm">Presupuestos ({budgets.length})</h3>
        <button onClick={() => setModal({ type: "create" })} className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors">Nuevo presupuesto</button>
      </div>

      {budgets.length === 0 ? (
        <p className="text-[#5A6A5A] text-sm">No hay presupuestos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category);
            return (
              <div key={b.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[#EAE6DD] font-medium text-sm">{b.name}</p>
                    {cat && <p className="text-[#5A6A5A] text-xs mt-0.5">{cat.name}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full border text-[#C8A96B] bg-[#C8A96B]/10 border-[#C8A96B]/30">{BUDGET_PERIOD_LABELS[b.period]}</span>
                </div>
                <p className="text-lg font-semibold text-[#EAE6DD] mb-1">{formatCurrency(b.amount, b.currency)}</p>
                <p className="text-[#5A6A5A] text-xs mb-4">Desde {formatDate(b.period_start)}{b.period_end ? ` hasta ${formatDate(b.period_end)}` : ""}</p>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ type: "edit", budget: b })} className="flex-1 px-3 py-1.5 text-xs text-[#5A6A5A] border border-[#2A2A2A] rounded-md hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors">Editar</button>
                  <button onClick={() => setModal({ type: "delete", budget: b })} className="flex-1 px-3 py-1.5 text-xs text-red-400 border border-red-900/30 rounded-md hover:bg-red-900/10 transition-colors">Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === "create" && (
        <BudgetModal title="Nuevo presupuesto" households={households} categories={categories}
          onSave={async (data) => {
            const created = await financeService.createBudget({ ...data, alert_threshold: data.alert_threshold ? Number(data.alert_threshold) : 80, period_end: data.period_end || null, category: data.category || null });
            onCreated(created); setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && modal.budget && (
        <BudgetModal title="Editar presupuesto" households={households} categories={categories}
          defaultValues={{ name: modal.budget.name, household_node: modal.budget.household_node, amount: modal.budget.amount, period: modal.budget.period, period_start: modal.budget.period_start, period_end: modal.budget.period_end ?? undefined, category: modal.budget.category ?? undefined, currency: modal.budget.currency, alert_threshold: String(modal.budget.alert_threshold) }}
          onSave={async (data) => {
            const updated = await financeService.updateBudget(modal.budget!.id, { ...data, alert_threshold: data.alert_threshold ? Number(data.alert_threshold) : 80, period_end: data.period_end || null, category: data.category || null });
            onUpdated(updated); setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && modal.budget && (
        <DeleteModal label={modal.budget.name}
          onConfirm={async () => { await financeService.removeBudget(modal.budget!.id); onDeleted(modal.budget!.id); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Tab: Gastos recurrentes ───────────────────────────────────────────────────

function RecurringTab({
  recurring, households, categories, onCreated, onUpdated, onDeleted,
}: {
  recurring: RecurringExpense[];
  households: HouseholdNode[];
  categories: FinanceCategory[];
  onCreated: (r: RecurringExpense) => void;
  onUpdated: (r: RecurringExpense) => void;
  onDeleted: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ type: "create" | "edit" | "delete"; item?: RecurringExpense } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (item: RecurringExpense) => {
    setTogglingId(item.id);
    try {
      const updated = await financeService.updateRecurring(item.id, { is_active: !item.is_active });
      onUpdated(updated);
    } finally { setTogglingId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#EAE6DD] font-medium text-sm">Gastos recurrentes ({recurring.length})</h3>
        <button onClick={() => setModal({ type: "create" })} className="px-3 py-1.5 text-xs text-[#C8A96B] border border-[#C8A96B]/30 rounded-md hover:bg-[#C8A96B]/10 transition-colors">Nuevo gasto recurrente</button>
      </div>

      {recurring.length === 0 ? (
        <p className="text-[#5A6A5A] text-sm">No hay gastos recurrentes.</p>
      ) : (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg divide-y divide-[#1E1E1E]">
          {recurring.map((r) => {
            const cat = categories.find((c) => c.id === r.category);
            return (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[#EAE6DD] text-sm font-medium">{r.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${r.is_active ? "text-green-400 bg-green-900/10 border-green-800/40" : "text-[#5A6A5A] bg-[#1A1A1A] border-[#2A2A2A]"}`}>
                      {r.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-[#5A6A5A] text-xs">
                    {RECURRING_FREQ_LABELS[r.frequency]}
                    {r.billing_day ? ` · día ${r.billing_day}` : ""}
                    {cat ? ` · ${cat.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-[#EAE6DD] text-sm font-medium">{formatCurrency(r.amount, r.currency)}</p>
                  <button onClick={() => handleToggle(r)} disabled={togglingId === r.id} className="text-xs text-[#5A6A5A] border border-[#2A2A2A] rounded-md px-2 py-1 hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors disabled:opacity-50">
                    {r.is_active ? "Pausar" : "Activar"}
                  </button>
                  <button onClick={() => setModal({ type: "edit", item: r })} className="text-xs text-[#5A6A5A] border border-[#2A2A2A] rounded-md px-2 py-1 hover:text-[#EAE6DD] hover:border-[#5A6A5A] transition-colors">Editar</button>
                  <button onClick={() => setModal({ type: "delete", item: r })} className="text-xs text-red-400 border border-red-900/30 rounded-md px-2 py-1 hover:bg-red-900/10 transition-colors">Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal?.type === "create" && (
        <RecurringModal title="Nuevo gasto recurrente" households={households} categories={categories}
          onSave={async (data) => {
            const created = await financeService.createRecurring({ ...data, billing_day: data.billing_day ? Number(data.billing_day) : null, reminder_days_before: data.reminder_days_before ? Number(data.reminder_days_before) : 3, category: data.category || null });
            onCreated(created); setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && modal.item && (
        <RecurringModal title="Editar gasto recurrente" households={households} categories={categories}
          defaultValues={{ name: modal.item.name, household_node: modal.item.household_node, amount: modal.item.amount, frequency: modal.item.frequency, currency: modal.item.currency, billing_day: modal.item.billing_day ? String(modal.item.billing_day) : undefined, reminder_days_before: String(modal.item.reminder_days_before), category: modal.item.category ?? undefined }}
          onSave={async (data) => {
            const updated = await financeService.updateRecurring(modal.item!.id, { ...data, billing_day: data.billing_day ? Number(data.billing_day) : null, reminder_days_before: data.reminder_days_before ? Number(data.reminder_days_before) : 3, category: data.category || null });
            onUpdated(updated); setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && modal.item && (
        <DeleteModal label={modal.item.name}
          onConfirm={async () => { await financeService.removeRecurring(modal.item!.id); onDeleted(modal.item!.id); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "accounts" | "transactions" | "budgets" | "recurring";

const TABS: { id: Tab; label: string }[] = [
  { id: "accounts", label: "Cuentas" },
  { id: "transactions", label: "Transacciones" },
  { id: "budgets", label: "Presupuestos" },
  { id: "recurring", label: "Gastos recurrentes" },
];

export default function FinancesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [households, setHouseholds] = useState<HouseholdNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      financeService.listAccounts(),
      financeService.listCategories(),
      financeService.listTransactions(),
      financeService.listBudgets(),
      financeService.listRecurring(),
      householdService.list(),
    ])
      .then(([acc, cats, txs, bud, rec, hh]) => {
        setAccounts(acc);
        setCategories(cats);
        setTransactions(txs);
        setBudgets(bud);
        setRecurring(rec);
        setHouseholds(hh);
      })
      .catch(() => setFetchError("No se pudo cargar la información financiera."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-400 text-sm">{fetchError}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Finanzas</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Gestión financiera del hogar</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#C8A96B] text-[#0D0D0D] font-medium"
                : "text-[#5A6A5A] hover:text-[#EAE6DD]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "accounts" && (
        <AccountsTab
          accounts={accounts}
          households={households}
          categories={categories}
          transactions={transactions}
          onAccountCreated={(a) => setAccounts((prev) => [a, ...prev])}
          onAccountUpdated={(a) => setAccounts((prev) => prev.map((x) => x.id === a.id ? a : x))}
          onAccountDeleted={(id) => setAccounts((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
      {activeTab === "transactions" && (
        <TransactionsTab
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          households={households}
          onCreated={(t) => {
            if (Array.isArray(t)) { setTransactions(t); }
            else { setTransactions((prev) => [t, ...prev]); }
          }}
          onDeleted={(id) => setTransactions((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
      {activeTab === "budgets" && (
        <BudgetsTab
          budgets={budgets}
          households={households}
          categories={categories}
          onCreated={(b) => setBudgets((prev) => [b, ...prev])}
          onUpdated={(b) => setBudgets((prev) => prev.map((x) => x.id === b.id ? b : x))}
          onDeleted={(id) => setBudgets((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
      {activeTab === "recurring" && (
        <RecurringTab
          recurring={recurring}
          households={households}
          categories={categories}
          onCreated={(r) => setRecurring((prev) => [r, ...prev])}
          onUpdated={(r) => setRecurring((prev) => prev.map((x) => x.id === r.id ? r : x))}
          onDeleted={(id) => setRecurring((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
