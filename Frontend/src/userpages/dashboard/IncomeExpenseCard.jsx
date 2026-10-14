import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const IncomeExpenseCard = ({ sales = [], expenses = [], selectedDate }) => {
  const incomeExpenseData = useMemo(() => {
    const dailyIncome = sales
      .filter(
        (sale) =>
          sale.status === "Completed" &&
          getDateKey(sale.sale_date ?? sale.created_at) === selectedDate,
      )
      .reduce((total, sale) => total + toNumber(sale.paid_amount), 0);

    const dailyExpenses = expenses
      .filter(
        (expense) =>
          expense.status === "Paid" &&
          getDateKey(expense.expense_date ?? expense.created_at) ===
            selectedDate,
      )
      .reduce((total, expense) => total + toNumber(expense.amount), 0);

    return [
      { type: "Income", income: dailyIncome, expense: 0 },
      { type: "Expense", income: 0, expense: dailyExpenses },
    ];
  }, [sales, expenses, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-5 text-lg font-bold text-slate-950">
        Income vs Expenses
      </h3>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={incomeExpenseData}
            margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="type"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(value) =>
                value >= 1000 ? `${value / 1000}k` : value
              }
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              formatter={(value) => [
                `$${toNumber(value).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}`,
              ]}
            />

            <Bar
              dataKey="income"
              name="Income"
              fill="#087443"
              radius={[3, 3, 0, 0]}
              barSize={35}
            />

            <Bar
              dataKey="expense"
              name="Expense"
              fill="#c1121f"
              radius={[3, 3, 0, 0]}
              barSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs font-semibold text-slate-700 sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#087443]" />
          Income
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#c1121f]" />
          Expense
        </div>
      </div>
    </motion.div>
  );
};

export default IncomeExpenseCard;
