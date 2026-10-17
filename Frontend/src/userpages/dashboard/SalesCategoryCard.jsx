import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useLanguage } from "../../context/LanguageContext";

const COLORS = ["#087443", "#2563eb", "#c1121f", "#94a3b8", "#7c3aed"];

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

const SalesCategoryCard = ({ sales = [], products = [], selectedDate }) => {
  const { t, language, isRTL } = useLanguage();

  const numberLocale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  const formatAmount = (value) =>
    `$${toNumber(value).toLocaleString(numberLocale, {
      maximumFractionDigits: 2,
    })}`;

  const { categoryData, categoryCount, totalSales } = useMemo(() => {
    const productMap = new Map(
      products.map((product) => [String(product.id), product]),
    );

    const totals = new Map();
    let total = 0;

    sales.forEach((sale) => {
      if (
        sale.status !== "Completed" ||
        getDateKey(sale.sale_date ?? sale.created_at) !== selectedDate
      ) {
        return;
      }

      const items = Array.isArray(sale.items) ? sale.items : [];

      items.forEach((item) => {
        const product = productMap.get(String(item.product_id));

        const categoryName =
          product?.category?.name || t("salesCategory.other");

        const itemValue = toNumber(item.total_price);

        if (itemValue <= 0) return;

        totals.set(categoryName, (totals.get(categoryName) || 0) + itemValue);

        total += itemValue;
      });
    });

    const sortedCategories = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    // Keep the chart readable by combining categories beyond the top four.
    const visibleCategories = sortedCategories.slice(0, 4);

    const remainingValue = sortedCategories
      .slice(4)
      .reduce((sum, [, value]) => sum + value, 0);

    const combinedCategories = visibleCategories.map(([name, value]) => ({
      name,
      value: total > 0 ? (value / total) * 100 : 0,
      amount: value,
    }));

    if (remainingValue > 0) {
      combinedCategories.push({
        name: t("salesCategory.otherCategories"),
        value: (remainingValue / total) * 100,
        amount: remainingValue,
      });
    }

    return {
      categoryData: combinedCategories.map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length],
      })),
      categoryCount: sortedCategories.length,
      totalSales: total,
    };
  }, [sales, products, selectedDate, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-3 text-lg font-bold text-slate-950">
        {t("salesCategory.title")}
      </h3>

      <div className="relative h-[245px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                direction: isRTL ? "rtl" : "ltr",
              }}
              formatter={(value, name, item) => [
                `${toNumber(value).toLocaleString(numberLocale, {
                  maximumFractionDigits: 1,
                })}% (${formatAmount(item.payload.amount)})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-950">
            {categoryCount.toLocaleString(numberLocale)}
          </span>

          <span className="text-xs font-semibold tracking-wide text-slate-700">
            {t("salesCategory.categories")}
          </span>
        </div>
      </div>

      {totalSales === 0 ? (
        <p className="mt-2 text-center text-sm text-slate-500">
          {t("salesCategory.noSales")}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {categoryData.map((category, index) => (
            <div
              key={`${category.name}-${index}`}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: category.color,
                  }}
                />

                <span className="truncate font-medium text-slate-700">
                  {category.name}
                </span>
              </div>

              <span className="shrink-0 font-semibold text-slate-900">
                {category.value.toLocaleString(numberLocale, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 1,
                })}
                %
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SalesCategoryCard;
