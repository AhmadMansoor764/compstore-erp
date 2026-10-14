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
import { MoreHorizontal } from "lucide-react";

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const SalesTrendCard = ({ sales = [], selectedDate }) => {
  const salesTrendData = useMemo(() => {
    if (!selectedDate) return [];

    // Use UTC date arithmetic to avoid date shifts across time zones.
    const endDate = new Date(`${selectedDate}T00:00:00.000Z`);
    const dates = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(endDate);
      date.setUTCDate(date.getUTCDate() - offset);

      const key = date.toISOString().slice(0, 10);

      dates.push({
        date: key,
        day: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        sales: 0,
      });
    }

    const totals = new Map(dates.map((item) => [item.date, 0]));

    sales.forEach((sale) => {
      if (sale.status !== "Completed") return;

      const dateKey = getDateKey(sale.sale_date ?? sale.created_at);

      if (totals.has(dateKey)) {
        totals.set(dateKey, totals.get(dateKey) + toNumber(sale.total_amount));
      }
    });

    return dates.map((item) => ({
      ...item,
      sales: totals.get(item.date) ?? 0,
    }));
  }, [sales, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950 sm:text-xl">
            Sales Trend
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Daily completed sales · 7 days
          </p>
        </div>

        <button
          type="button"
          title="Sales trend for the selected date and previous six days"
          aria-label="Sales trend information"
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
        >
          <MoreHorizontal size={23} />
        </button>
      </div>

      <div className="h-[260px] w-full sm:h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={salesTrendData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${value / 1000}k`;
                return value;
              }}
            />

            <Tooltip
              labelFormatter={(label) => `Date: ${label}`}
              cursor={{ fill: "#f1f5f9" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              formatter={(value) => [
                `$${toNumber(value).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}`,
                "Sales",
              ]}
            />

            <Bar
              dataKey="sales"
              name="Sales"
              fill="#aebffb"
              radius={[4, 4, 0, 0]}
              barSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SalesTrendCard;
