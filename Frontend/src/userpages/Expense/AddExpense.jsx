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

const formatMoney = (amount) => {
  return `${Number(amount || 0).toLocaleString()} AFN`;
};

const AddExpense = () => {
  const navigate = useNavigate();

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter an expense title");
      return;
    }

    if (!category) {
      toast.error("Please select an expense category");
      return;
    }

    if (
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    if (!expenseDate) {
      toast.error("Please select an expense date");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!status) {
      toast.error("Please select an expense status");
      return;
    }

    if (!paidBy.trim()) {
      toast.error("Please enter who paid the expense");
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create expense");
      }

      toast.success(data.message || "Expense created successfully");
      navigate("/dashboard/expenses");
    } catch (error) {
      console.error("Create expense error:", error);
      toast.error(error.message || "Something went wrong");
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Wallet size={16} />
            <span>Financial Management</span>
            <span>/</span>
            <span>Expenses</span>
            <span>/</span>
            <span className="text-slate-700">New Expense</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add New Expense
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Record a shop expense and track its payment details.
          </p>
        </div>

        <Link
          to="/dashboard/expenses"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to Expenses
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ReceiptText size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Expense Information
              </h2>

              <p className="text-sm text-slate-500">
                Enter the main details of this expense.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Title */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Expense Title <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Shop Rent"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select category</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Salary">Salary</option>
                <option value="Transportation">Transportation</option>
                <option value="Supplies">Supplies</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Amount <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <CircleDollarSign
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Expense Date */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Expense Date <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <CalendarDays
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Payment Method <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Status <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Paid By */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Paid By <span className="text-red-500">*</span>
              </label>

              <div className="relative mt-2">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  required
                  value={paidBy}
                  onChange={(event) => setPaidBy(event.target.value)}
                  placeholder="e.g. Store Owner"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Reference
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="e.g. RENT-SEP-001"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Additional Details
              </h2>

              <p className="text-sm text-slate-500">
                Add an optional description for this expense.
              </p>
            </div>
          </div>

          <label className="text-sm font-medium text-slate-700">
            Description
            <span className="ml-1 text-xs font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Write a short description..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </motion.section>

        {/* Summary */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 font-semibold text-slate-900">Expense Summary</h2>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Total Expense
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatMoney(amount)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
              <span className="text-sm font-medium text-slate-500">
                Payment Status
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  status === "Paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : status === "Pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard/expenses"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Save size={17} />
              Save Expense
            </button>
          </div>
        </motion.section>
      </form>
    </div>
  );
};

export default AddExpense;
