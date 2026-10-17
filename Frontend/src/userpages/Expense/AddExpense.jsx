import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ReceiptText,
  Save,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const AddExpense = () => {
  const navigate = useNavigate();
  const { language, isRTL, t } = useLanguage();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [status, setStatus] = useState("Paid");
  const [paidBy, setPaidBy] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const tr = (key) => t(`addExpense.${key}`);

  const getTranslatedOption = (group, value) => {
    const translated = t(`addExpense.${group}.${value}`);

    // Keep the original value if a translation is not available.
    return translated === `addExpense.${group}.${value}` ? value : translated;
  };

  const formatMoney = (value) => {
    const locale =
      language === "ps" ? "ps-AF" : language === "fa" ? "fa-AF" : "en-US";

    return `${Number(value || 0).toLocaleString(locale)} AFN`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!title.trim()) {
      toast.error(tr("messages.titleRequired"));
      return;
    }

    if (!category) {
      toast.error(tr("messages.categoryRequired"));
      return;
    }

    if (
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      toast.error(tr("messages.amountInvalid"));
      return;
    }

    if (!expenseDate) {
      toast.error(tr("messages.dateRequired"));
      return;
    }

    if (!paymentMethod) {
      toast.error(tr("messages.paymentMethodRequired"));
      return;
    }

    if (!status) {
      toast.error(tr("messages.statusRequired"));
      return;
    }

    if (!paidBy.trim()) {
      toast.error(tr("messages.paidByRequired"));
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            category,
            amount: Number(amount),
            expenseDate,
            paymentMethod,
            status,
            paidBy: paidBy.trim(),
            reference: reference.trim(),
            description: description.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || tr("messages.createFailed"));
      }

      toast.success(data.message || tr("messages.created"));

      navigate("/dashboard/expenses");
    } catch (error) {
      console.error("Create expense error:", error);

      toast.error(error.message || tr("messages.somethingWentWrong"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  const labelClass = "text-sm font-medium text-slate-700";

  const iconPosition = isRTL ? "right-3" : "left-3";
  const inputIconPadding = isRTL ? "pr-10 pl-4" : "pl-10 pr-4";

  const paymentStatusClass =
    status === "Paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-w-0 space-y-6 text-start">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Wallet size={16} />
            <span>{tr("financialManagement")}</span>
            <span>/</span>
            <span>{tr("expenses")}</span>
            <span>/</span>
            <span className="text-slate-700">{tr("newExpense")}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {tr("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {tr("subtitle")}
          </p>
        </div>

        <Link
          to="/dashboard/expenses"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} />
          {tr("backToExpenses")}
        </Link>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expense Information */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ReceiptText size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {tr("expenseInformation")}
              </h2>

              <p className="text-sm text-slate-500">
                {tr("expenseInformationHint")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Title */}
            <div>
              <label className={labelClass}>
                {tr("expenseTitle")} <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={tr("expenseTitlePlaceholder")}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>
                {tr("category")} <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
              >
                <option value="">{tr("selectCategory")}</option>
                {[
                  "Rent",
                  "Utilities",
                  "Salary",
                  "Transportation",
                  "Supplies",
                  "Maintenance",
                  "Other",
                ].map((value) => (
                  <option key={value} value={value}>
                    {getTranslatedOption("categories", value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={labelClass}>
                {tr("amount")} <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <CircleDollarSign
                  size={17}
                  className={`pointer-events-none absolute ${iconPosition} top-1/2 -translate-y-1/2 text-slate-400`}
                />

                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 ${inputIconPadding} text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100`}
                />
              </div>
            </div>

            {/* Expense Date */}
            <div>
              <label className={labelClass}>
                {tr("expenseDate")} <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <CalendarDays
                  size={17}
                  className={`pointer-events-none absolute ${iconPosition} top-1/2 -translate-y-1/2 text-slate-400`}
                />

                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 ${inputIconPadding} text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100`}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className={labelClass}>
                {tr("paymentMethod")} <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={inputClass}
              >
                {["Cash", "Bank Transfer", "Mobile Money", "Card", "Other"].map(
                  (value) => (
                    <option key={value} value={value}>
                      {getTranslatedOption("paymentMethods", value)}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>
                {tr("paymentStatus")} <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={inputClass}
              >
                {["Paid", "Pending", "Cancelled"].map((value) => (
                  <option key={value} value={value}>
                    {getTranslatedOption("statuses", value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Paid By */}
            <div>
              <label className={labelClass}>
                {tr("paidBy")} <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <UserRound
                  size={17}
                  className={`pointer-events-none absolute ${iconPosition} top-1/2 -translate-y-1/2 text-slate-400`}
                />

                <input
                  type="text"
                  required
                  value={paidBy}
                  onChange={(event) => setPaidBy(event.target.value)}
                  placeholder={tr("paidByPlaceholder")}
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 ${inputIconPadding} text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100`}
                />
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className={labelClass}>
                {tr("reference")}
                <span className="ms-1 text-xs font-normal text-slate-400">
                  ({tr("optional")})
                </span>
              </label>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder={tr("referencePlaceholder")}
                className={inputClass}
              />
            </div>
          </div>
        </motion.section>

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {tr("additionalDetails")}
              </h2>

              <p className="text-sm text-slate-500">
                {tr("additionalDetailsHint")}
              </p>
            </div>
          </div>

          <label className={labelClass}>
            {tr("description")}
            <span className="ms-1 text-xs font-normal text-slate-400">
              ({tr("optional")})
            </span>
          </label>

          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={tr("descriptionPlaceholder")}
            className={`${inputClass} resize-none`}
          />
        </motion.section>

        {/* Summary */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 font-semibold text-slate-900">
            {tr("expenseSummary")}
          </h2>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                {tr("totalExpense")}
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatMoney(amount)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
              <span className="text-sm font-medium text-slate-500">
                {tr("paymentStatus")}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${paymentStatusClass}`}
              >
                {getTranslatedOption("statuses", status)}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard/expenses"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {tr("cancel")}
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? tr("saving") : tr("saveExpense")}
            </button>
          </div>
        </motion.section>
      </form>
    </div>
  );
};

export default AddExpense;
