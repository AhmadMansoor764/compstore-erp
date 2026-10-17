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
import { useLanguage } from "../../context/LanguageContext";

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const IncomeExpenseCard = ({ sales = [], expenses = [], selectedDate }) => {
  const { t, language, isRTL } = useLanguage();

  const numberLocale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  const formatAmount = (value) =>
    `$${toNumber(value).toLocaleString(numberLocale, {
      maximumFractionDigits: 2,
    })}`;

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
      {
        type: t("incomeExpense.income"),
        income: dailyIncome,
        expense: 0,
      },
      {
        type: t("incomeExpense.expense"),
        income: 0,
        expense: dailyExpenses,
      },
    ];
  }, [sales, expenses, selectedDate, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-5 text-lg font-bold text-slate-950">
        {t("incomeExpense.title")}
      </h3>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={incomeExpenseData}
            margin={{
              top: 5,
              right: isRTL ? 20 : 0,
              left: isRTL ? 0 : -25,
              bottom: 0,
            }}
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
              orientation={isRTL ? "right" : "left"}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(value) =>
                value >= 1000
                  ? `${(value / 1000).toLocaleString(numberLocale)}k`
                  : value.toLocaleString(numberLocale)
              }
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                direction: isRTL ? "rtl" : "ltr",
              }}
              formatter={(value) => [formatAmount(value)]}
            />

            <Bar
              dataKey="income"
              name={t("incomeExpense.income")}
              fill="#087443"
              radius={[3, 3, 0, 0]}
              barSize={35}
            />

            <Bar
              dataKey="expense"
              name={t("incomeExpense.expense")}
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
          {t("incomeExpense.income")}
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#c1121f]" />
          {t("incomeExpense.expense")}
        </div>
      </div>
    </motion.div>
  );
};

export default IncomeExpenseCard;
