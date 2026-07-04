"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Copy, Plus, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import {
  buildFinanceRange,
  buildInstallmentPreview,
  calculateReimbursement,
  estimateCardDates,
  financeCategories,
  financeCategoryColors,
  financeCurrencies,
  financeSummary,
  formatMoney,
  parseFinanceText,
  shiftFinanceRangeAnchor
} from "@/lib/finance";
import type {
  FinanceCategoryRule,
  FinanceCurrency,
  FinancePaymentKind,
  FinancePaymentMethod,
  FinanceRangeMode,
  FinanceScheduledPayment,
  FinanceSettings,
  FinanceTransaction,
  FinanceTransactionType
} from "@/types/apex";

type FinanceViewProps = {
  selectedDateKey: string;
  transactions: FinanceTransaction[];
  rules: FinanceCategoryRule[];
  paymentMethods: FinancePaymentMethod[];
  scheduledPayments: FinanceScheduledPayment[];
  settings: FinanceSettings | null;
  onSave: (transaction: Omit<FinanceTransaction, "id" | "createdAt" | "updatedAt">) => void;
  onDelete: (id: number) => void;
  onAddPaymentMethod: (method: Omit<FinancePaymentMethod, "id" | "createdAt" | "updatedAt">) => Promise<number>;
  onUpdateSettings: (settings: Partial<FinanceSettings>) => void;
};

const fallbackSettings: FinanceSettings = {
  id: "finance",
  monthRangeStartDay: 1,
  monthRangeEndDay: 0,
  incomeSources: ["Sueldo", "Cobro deuda", "Facturacion", "2do sueldo", "Otro"],
  createdAt: "",
  updatedAt: ""
};

export function FinanceView({ selectedDateKey, transactions, rules, paymentMethods, scheduledPayments, settings, onSave, onDelete, onAddPaymentMethod, onUpdateSettings }: FinanceViewProps) {
  const financeSettings = settings ?? fallbackSettings;
  const defaultMethod = paymentMethods.find((item) => item.id === financeSettings.defaultPaymentMethodId) ?? paymentMethods.find((item) => item.label === "Mercado Pago") ?? paymentMethods[0];

  const [rangeMode, setRangeMode] = useState<FinanceRangeMode>("month");
  const [rangeAnchor, setRangeAnchor] = useState(selectedDateKey);
  const [customRange, setCustomRange] = useState({ from: selectedDateKey, to: selectedDateKey });
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [quickText, setQuickText] = useState("");
  const [type, setType] = useState<FinanceTransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [currency, setCurrency] = useState<FinanceCurrency>("ARS");
  const [dateKeyValue, setDateKeyValue] = useState(selectedDateKey);
  const [category, setCategory] = useState("Otros");
  const [incomeSource, setIncomeSource] = useState(financeSettings.incomeSources[0] ?? "Sueldo");
  const [manualCategory, setManualCategory] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<number | "">(defaultMethod?.id ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(selectedDateKey);
  const [reimbursementOpen, setReimbursementOpen] = useState(false);
  const [reimbursementMode, setReimbursementMode] = useState<"amount" | "percent">("percent");
  const [reimbursementValue, setReimbursementValue] = useState(0);
  const [extraInfo, setExtraInfo] = useState("");
  const [newMethodOpen, setNewMethodOpen] = useState(false);
  const [newMethodLabel, setNewMethodLabel] = useState("");
  const [newMethodKind, setNewMethodKind] = useState<FinancePaymentKind>("debit");
  const [newClosingDay, setNewClosingDay] = useState(25);
  const [newClosingBusinessDays, setNewClosingBusinessDays] = useState(0);
  const [newPaymentDay, setNewPaymentDay] = useState(10);
  const [newPaymentBusinessDay, setNewPaymentBusinessDay] = useState(0);
  const [newIncomeSource, setNewIncomeSource] = useState("");
  const copiedTimer = useRef<number | null>(null);

  const selectedPaymentMethod = paymentMethods.find((item) => item.id === paymentMethodId);
  const activeRange = buildFinanceRange(rangeMode, rangeAnchor, financeSettings, customRange);
  const filteredTransactions = transactions.filter((item) => item.dateKey >= activeRange.from && item.dateKey <= activeRange.to);
  const filteredScheduled = scheduledPayments.filter((item) => item.dueDateKey >= activeRange.from && item.dueDateKey <= activeRange.to);
  const summary = useMemo(() => financeSummary(filteredTransactions), [filteredTransactions]);
  const maxCategory = Math.max(1, ...summary.byCategory.map((item) => item.total));
  const suggestion = parseFinanceText(quickText, rules, dateKeyValue);
  const cardDates = estimateCardDates(dateKeyValue, selectedPaymentMethod);
  const installmentPreview = buildInstallmentPreview({ amount, count: installmentCount, dateKey: dateKeyValue, paymentMethod: selectedPaymentMethod, firstDueDateKey: firstInstallmentDate });
  const reimbursement = calculateReimbursement(amount, reimbursementMode, reimbursementValue);

  useEffect(() => {
    if (defaultMethod?.id) setPaymentMethodId(defaultMethod.id);
  }, [defaultMethod?.id]);

  useEffect(() => {
    if (!quickText.trim()) return;
    const draft = parseFinanceText(quickText, rules, dateKeyValue);
    setType(draft.type);
    setDescription(draft.description);
    setAmount(draft.amount);
    setCurrency(draft.currency);
    if (!manualCategory) setCategory(draft.category);
  }, [dateKeyValue, manualCategory, quickText, rules]);

  function moveRange(direction: -1 | 1) {
    if (rangeMode === "custom") {
      const from = shiftFinanceRangeAnchor("day", customRange.from, direction);
      const to = shiftFinanceRangeAnchor("day", customRange.to, direction);
      setCustomRange({ from, to });
      return;
    }
    setRangeAnchor(shiftFinanceRangeAnchor(rangeMode, rangeAnchor, direction));
  }

  function resetForm() {
    setQuickText("");
    setType("expense");
    setDescription("");
    setAmount("");
    setCurrency("ARS");
    setDateKeyValue(selectedDateKey);
    setCategory("Otros");
    setManualCategory(false);
    setInstallmentsOpen(false);
    setReimbursementOpen(false);
    setExtraInfo("");
  }

  function save() {
    const cleanDescription = description.trim() || quickText.trim();
    if (!cleanDescription || !amount || amount <= 0) return;
    const method = selectedPaymentMethod;
    const installments = installmentsOpen && installmentPreview ? {
      count: installmentPreview.count,
      firstDueDateKey: installmentPreview.firstDueDateKey,
      amountPerInstallment: installmentPreview.amountPerInstallment
    } : undefined;
    onSave({
      type,
      description: cleanDescription,
      amount,
      currency,
      category,
      incomeSource: type === "income" ? incomeSource : undefined,
      dateKey: dateKeyValue,
      occurredAt: `${dateKeyValue}T12:00:00`,
      paymentMethodId: method?.id,
      paymentMethodLabel: method?.label,
      paymentKind: method?.kind,
      installments,
      reimbursement: reimbursementOpen && reimbursementValue > 0 ? { mode: reimbursementMode, value: reimbursementValue, ...reimbursement } : undefined,
      extraInfo: extraInfo.trim() || undefined,
      cardStatementDateKey: cardDates?.statementDateKey,
      cardPaymentDateKey: cardDates?.paymentDateKey,
      source: quickText.trim() ? "quick" : "manual"
    });
    resetForm();
  }

  async function addPaymentMethod() {
    const label = newMethodLabel.trim();
    if (!label) return;
    const id = await onAddPaymentMethod({
      label,
      kind: newMethodKind,
      closingDay: newMethodKind === "credit" && !newClosingBusinessDays ? newClosingDay : undefined,
      closingBusinessDaysBeforeMonthEnd: newMethodKind === "credit" && newClosingBusinessDays ? newClosingBusinessDays : undefined,
      paymentDay: newMethodKind === "credit" && !newPaymentBusinessDay ? newPaymentDay : undefined,
      paymentBusinessDayFromMonthStart: newMethodKind === "credit" && newPaymentBusinessDay ? newPaymentBusinessDay : undefined
    });
    setPaymentMethodId(id);
    setNewMethodLabel("");
    setNewMethodOpen(false);
  }

  function setRangeFromDates(from: string, to: string) {
    setRangeMode("custom");
    setCustomRange({ from, to });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <header className="px-1 pt-1">
        <p className="text-xs text-[rgb(var(--muted))]">Finanzas</p>
        <h1 className="text-2xl font-semibold tracking-normal">Que gastaste?</h1>
      </header>

      <section className="rounded-[20px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-soft">
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-[rgb(var(--surface-strong))] p-1">
          {(["day", "week", "month", "custom"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setRangeMode(mode)} className={`min-h-9 rounded-xl text-xs font-semibold ${rangeMode === mode ? "bg-[rgb(var(--accent))] text-black" : "text-[rgb(var(--muted))]"}`}>
              {mode === "day" ? "Dia" : mode === "week" ? "Semana" : mode === "month" ? "Mes" : "Pers."}
            </button>
          ))}
        </div>
        <div
          className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[rgb(var(--surface-strong))] px-2 py-2"
          onPointerDown={(event) => setDragStartX(event.clientX)}
          onPointerUp={(event) => {
            if (dragStartX === null) return;
            const delta = event.clientX - dragStartX;
            if (Math.abs(delta) > 36) moveRange(delta > 0 ? -1 : 1);
            setDragStartX(null);
          }}
        >
          <button type="button" onClick={() => moveRange(-1)} className="grid size-9 place-items-center rounded-full bg-[rgb(var(--surface))]" aria-label="Rango anterior">
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs font-semibold">{rangeMode === "custom" ? "Personalizado" : rangeMode === "month" ? "Mes del usuario" : rangeMode === "week" ? "Semana" : "Dia"}</p>
            <p className="truncate text-[11px] text-[rgb(var(--muted))]">{activeRange.label}</p>
          </div>
          <button type="button" onClick={() => moveRange(1)} className="grid size-9 place-items-center rounded-full bg-[rgb(var(--surface))]" aria-label="Rango siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
        {rangeMode === "custom" ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input value={customRange.from} onChange={(event) => setRangeFromDates(event.target.value, customRange.to)} type="date" className="rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-xs outline-none" />
            <input value={customRange.to} onChange={(event) => setRangeFromDates(customRange.from, event.target.value)} type="date" className="rounded-xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-xs outline-none" />
          </div>
        ) : null}
      </section>

      <section className="rounded-[20px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
        <div className="flex items-center gap-2 rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2.5">
          <Sparkles size={17} className="shrink-0 text-[rgb(var(--accent))]" />
          <input value={quickText} onChange={(event) => { setQuickText(event.target.value); setManualCategory(false); }} placeholder="Uber 4500,50" className="min-h-9 w-full bg-transparent text-base font-medium outline-none placeholder:text-[rgb(var(--muted))]" autoComplete="off" />
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <label className="rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="block text-[11px] font-medium text-[rgb(var(--muted))]">$ Monto</span>
            <input value={amount} onChange={(event) => setAmount(event.target.value ? Number(event.target.value.replace(",", ".")) : "")} inputMode="decimal" type="text" placeholder="0" className="mt-1 w-full bg-transparent text-xl font-semibold outline-none" />
          </label>
          <label className="min-w-[86px] rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="block text-[11px] font-medium text-[rgb(var(--muted))]">Moneda</span>
            <select value={currency} onChange={(event) => setCurrency(event.target.value as FinanceCurrency)} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none">
              {financeCurrencies.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--muted))]"><CalendarDays size={13} /> Fecha</span>
            <input value={dateKeyValue} onChange={(event) => setDateKeyValue(event.target.value)} type="date" className="mt-1 w-full bg-transparent text-sm font-semibold outline-none" />
          </label>
          <label className="rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="block text-[11px] font-medium text-[rgb(var(--muted))]">Categoria</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setManualCategory(true); }} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none">
              {financeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {type === "income" ? (
          <label className="mt-2 block rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="block text-[11px] font-medium text-[rgb(var(--muted))]">Ingreso</span>
            <select value={incomeSource} onChange={(event) => setIncomeSource(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none">
              {financeSettings.incomeSources.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        ) : null}

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <label className="rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
            <span className="block text-[11px] font-medium text-[rgb(var(--muted))]">Forma de pago</span>
            <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(Number(event.target.value))} className="mt-1 w-full bg-transparent text-sm font-semibold outline-none">
              {paymentMethods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setNewMethodOpen((value) => !value)} className="grid min-w-12 place-items-center rounded-2xl bg-[rgb(var(--surface-strong))]" aria-label="Agregar medio de pago">
            <Plus size={17} />
          </button>
        </div>

        {newMethodOpen ? (
          <div className="mt-2 space-y-2 rounded-2xl bg-[rgb(var(--surface-strong))] p-3">
            <input value={newMethodLabel} onChange={(event) => setNewMethodLabel(event.target.value)} placeholder="Visa cred. BBVA" className="w-full rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none" />
            <select value={newMethodKind} onChange={(event) => setNewMethodKind(event.target.value as FinancePaymentKind)} className="w-full rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none">
              <option value="debit">Debito</option>
              <option value="credit">Tarjeta credito</option>
              <option value="wallet">Aplicacion</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
            {newMethodKind === "credit" ? (
              <div className="grid grid-cols-2 gap-2">
                <LabeledNumber label="Cierre dia fijo" value={newClosingDay} onChange={setNewClosingDay} />
                <LabeledNumber label="O habiles antes fin" value={newClosingBusinessDays} onChange={setNewClosingBusinessDays} />
                <LabeledNumber label="Pago dia fijo" value={newPaymentDay} onChange={setNewPaymentDay} />
                <LabeledNumber label="O habil desde mes" value={newPaymentBusinessDay} onChange={setNewPaymentBusinessDay} />
              </div>
            ) : null}
            <button type="button" onClick={() => void addPaymentMethod()} className="min-h-10 w-full rounded-xl bg-[rgb(var(--accent))] text-sm font-bold text-black">Anadir</button>
          </div>
        ) : null}

        <div className="mt-2 flex rounded-2xl bg-[rgb(var(--surface-strong))] p-1">
          {(["expense", "income"] as const).map((item) => (
            <button key={item} type="button" onClick={() => { setType(item); if (item === "income") setCategory("Ingresos"); }} className={`min-h-9 flex-1 rounded-xl text-sm font-semibold transition ${type === item ? "bg-[rgb(var(--accent))] text-black" : "text-[rgb(var(--muted))]"}`}>
              {item === "expense" ? "Gasto" : "Ingreso"}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setAdvancedOpen((value) => !value)} className="mt-2 flex min-h-10 w-full items-center justify-between rounded-2xl bg-[rgb(var(--surface-strong))] px-3 text-sm font-semibold">
          <span className="flex items-center gap-2"><SlidersHorizontal size={15} /> Otras opciones</span>
          <span className="text-xs text-[rgb(var(--muted))]">{advancedOpen ? "Cerrar" : "Abrir"}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-2 space-y-2 rounded-2xl bg-[rgb(var(--surface-strong))] p-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setInstallmentsOpen((value) => !value)} className={`min-h-10 rounded-xl text-sm font-semibold ${installmentsOpen ? "bg-[rgb(var(--accent))] text-black" : "bg-[rgb(var(--surface))]"}`}>Son cuotas</button>
              <button type="button" onClick={() => setReimbursementOpen((value) => !value)} className={`min-h-10 rounded-xl text-sm font-semibold ${reimbursementOpen ? "bg-[rgb(var(--accent))] text-black" : "bg-[rgb(var(--surface))]"}`}>Reintegro</button>
            </div>
            {installmentsOpen ? (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-1">
                  {[3, 6, 9, 12, 18].map((item) => <button key={item} type="button" onClick={() => setInstallmentCount(item)} className={`min-h-9 rounded-xl text-xs font-bold ${installmentCount === item ? "bg-[rgb(var(--accent))] text-black" : "bg-[rgb(var(--surface))]"}`}>{item}</button>)}
                  <input value={installmentCount} onChange={(event) => setInstallmentCount(Number(event.target.value) || 1)} type="number" className="rounded-xl bg-[rgb(var(--surface))] px-2 text-center text-xs outline-none" />
                </div>
                {selectedPaymentMethod?.kind !== "credit" ? <input value={firstInstallmentDate} onChange={(event) => setFirstInstallmentDate(event.target.value)} type="date" className="w-full rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-xs outline-none" /> : null}
                {installmentPreview ? <p className="text-xs text-[rgb(var(--muted))]">{installmentPreview.label}</p> : null}
              </div>
            ) : null}
            {reimbursementOpen ? (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                  <select value={reimbursementMode} onChange={(event) => setReimbursementMode(event.target.value as "amount" | "percent")} className="rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none">
                    <option value="percent">%</option>
                    <option value="amount">Monto</option>
                  </select>
                  <input value={reimbursementValue} onChange={(event) => setReimbursementValue(Number(event.target.value) || 0)} type="number" className="rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none" />
                </div>
                <p className="text-xs text-[rgb(var(--muted))]">Descuento {formatMoney(reimbursement.discountAmount, currency)} · Neto {formatMoney(reimbursement.netAmount, currency)}</p>
                {reimbursementMode === "percent" ? <p className="text-[11px] text-[rgb(var(--muted))]">* verificar tope de reintegro</p> : null}
              </div>
            ) : null}
            <textarea value={extraInfo} onChange={(event) => setExtraInfo(event.target.value)} placeholder="Alias, CBU, nota libre" className="min-h-20 w-full rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <LabeledNumber label="Mes desde dia" value={financeSettings.monthRangeStartDay} onChange={(value) => onUpdateSettings({ monthRangeStartDay: value })} />
              <LabeledNumber label="Hasta dia (0=fin)" value={financeSettings.monthRangeEndDay} onChange={(value) => onUpdateSettings({ monthRangeEndDay: value })} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={newIncomeSource} onChange={(event) => setNewIncomeSource(event.target.value)} placeholder="Nuevo ingreso" className="rounded-xl bg-[rgb(var(--surface))] px-3 py-2 text-sm outline-none" />
              <button type="button" onClick={() => { if (newIncomeSource.trim()) onUpdateSettings({ incomeSources: [...financeSettings.incomeSources, newIncomeSource.trim()] }); setNewIncomeSource(""); }} className="rounded-xl bg-[rgb(var(--surface))] px-3 text-sm font-semibold">Agregar</button>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-[rgb(var(--muted))]">
            {quickText.trim() ? `Sugerido: ${suggestion.category}` : selectedPaymentMethod?.kind === "credit" && cardDates ? `Resumen: ${cardDates.statementDateKey} · Pago: ${cardDates.paymentDateKey}` : "ARS, hoy y Mercado Pago por defecto"}
          </p>
          <button type="button" onClick={save} disabled={!description.trim() && !quickText.trim()} className="min-h-11 shrink-0 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-bold text-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">Guardar</button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <FinanceMetric label="Ingresos" value={formatMoney(summary.income)} />
        <FinanceMetric label="Gastos" value={formatMoney(summary.expenses)} />
        <FinanceMetric label="Balance" value={formatMoney(summary.balance)} />
      </section>

      <section className="rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Categorias</h2><span className="text-xs text-[rgb(var(--muted))]">{activeRange.label}</span></div>
        <div className="space-y-2">
          {summary.byCategory.slice(0, 8).map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs"><span>{item.category}</span><span className="text-[rgb(var(--muted))]">{formatMoney(item.total)}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-strong))]"><div className="h-full rounded-full" style={{ width: `${Math.max(8, (item.total / maxCategory) * 100)}%`, backgroundColor: financeCategoryColors[item.category] ?? financeCategoryColors.Otros }} /></div>
            </div>
          ))}
          {!summary.byCategory.length ? <p className="py-3 text-sm text-[rgb(var(--muted))]">No hay gastos en este rango.</p> : null}
        </div>
      </section>

      <section className="rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
        <h2 className="mb-3 text-base font-semibold">Ultimos movimientos</h2>
        <div className="space-y-2">
          {filteredTransactions.slice(0, 8).map((item) => (
            <div key={item.id ?? `${item.createdAt}-${item.description}`} className="flex min-h-12 items-center gap-3 rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${financeCategoryColors[item.category] ?? financeCategoryColors.Otros}33`, color: financeCategoryColors[item.category] ?? financeCategoryColors.Otros }}><CircleDollarSign size={16} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.description}</span><span className="block truncate text-[11px] text-[rgb(var(--muted))]">{item.category} · {item.paymentMethodLabel ?? "Sin pago"} · {item.dateKey}</span></span>
              {item.extraInfo ? <button type="button" onClick={() => { void navigator.clipboard?.writeText(item.extraInfo ?? ""); if (copiedTimer.current) window.clearTimeout(copiedTimer.current); copiedTimer.current = window.setTimeout(() => undefined, 800); }} className="grid size-8 shrink-0 place-items-center rounded-full text-[rgb(var(--muted))]" aria-label="Copiar info"><Copy size={14} /></button> : null}
              <span className="shrink-0 text-right text-sm font-semibold">{formatMoney(item.amount, item.currency)}</span>
              {item.id ? <button type="button" onClick={() => onDelete(item.id!)} className="grid size-8 shrink-0 place-items-center rounded-full text-[rgb(var(--muted))]" aria-label="Eliminar movimiento"><Trash2 size={15} /></button> : null}
            </div>
          ))}
          {!filteredTransactions.length ? <p className="py-3 text-sm text-[rgb(var(--muted))]">Escribi algo como Uber 4500,50 y guardalo.</p> : null}
        </div>
      </section>

      {filteredScheduled.length ? (
        <section className="rounded-[18px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
          <h2 className="mb-3 text-base font-semibold">Pagos agendados</h2>
          <div className="space-y-2">
            {filteredScheduled.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--surface-strong))] px-3 py-2 text-sm"><span className="min-w-0 truncate">{item.title}</span><span className="shrink-0 text-xs text-[rgb(var(--muted))]">{item.dueDateKey} · {formatMoney(item.amount, item.currency)}</span></div>)}
          </div>
        </section>
      ) : null}
    </motion.div>
  );
}

function FinanceMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-h-[78px] rounded-[16px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-soft"><p className="text-[11px] text-[rgb(var(--muted))]">{label}</p><p className="mt-2 truncate text-sm font-bold">{value}</p></div>;
}

function LabeledNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block rounded-xl bg-[rgb(var(--surface))] px-3 py-2"><span className="block text-[10px] text-[rgb(var(--muted))]">{label}</span><input value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} type="number" className="mt-1 w-full bg-transparent text-sm font-semibold outline-none" /></label>;
}
