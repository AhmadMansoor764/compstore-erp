import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const LowStockAlerts = ({ products = [], loading = false }) => {
  const lowStockProducts = useMemo(
    () =>
      products
        .filter((product) => {
          const quantity = Number(product.quantity ?? 0);
          const threshold = Number(product.low_stock_threshold ?? 5);

          return quantity <= threshold;
        })
        .sort((a, b) => Number(a.quantity) - Number(b.quantity))
        .slice(0, 4)
        .map((product) => ({
          ...product,
          status: Number(product.quantity ?? 0) <= 0 ? "Critical" : "Low",
        })),
    [products],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#c8cce0] bg-[#f8f8ff] px-5 py-5">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          <h3 className="text-lg font-bold text-slate-950">Low Stock Alerts</h3>
        </div>

        <Link
          to="/dashboard/stock"
          className="shrink-0 text-sm font-semibold text-[#1746b8] hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="hidden grid-cols-[1fr_60px_75px] border-b border-[#c8cce0] px-5 py-3 text-xs font-medium text-slate-700 sm:grid">
        <span>Item</span>
        <span>Qty</span>
        <span>Status</span>
      </div>

      {loading ? (
        <p className="px-5 py-6 text-sm text-slate-500">Loading stock…</p>
      ) : lowStockProducts.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-500">
          All products are sufficiently stocked.
        </p>
      ) : (
        <div>
          {lowStockProducts.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-1 gap-3 border-b border-[#c8cce0] px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_60px_75px] sm:items-center sm:gap-0"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-slate-950 sm:text-[15px]">
                  {product.name}
                </p>
                <p className="break-all text-xs font-medium text-slate-700">
                  {product.sku}
                </p>
              </div>

              <div className="flex items-center justify-between sm:block">
                <span className="text-xs text-slate-500 sm:hidden">
                  Quantity
                </span>
                <span className="text-sm font-medium text-slate-950">
                  {product.quantity}
                </span>
              </div>

              <div className="flex items-center justify-between sm:block">
                <span className="text-xs text-slate-500 sm:hidden">Status</span>
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                    product.status === "Critical"
                      ? "bg-red-100 text-red-700"
                      : "bg-[#e4e6f1] text-slate-700"
                  }`}
                >
                  {product.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LowStockAlerts;
