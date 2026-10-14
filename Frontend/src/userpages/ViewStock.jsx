import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Package,
  Pencil,
  ShoppingCart,
  Tag,
  Truck,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://localhost:3000/api";

const formatMoney = (value) =>
  `$${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ViewStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError("");
        setProduct(null);

        const response = await fetch(`${API_URL}/products/${id}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load product details.");
        }

        const databaseProduct = data.product || data;

        if (!databaseProduct || databaseProduct.id == null) {
          throw new Error("Product details were not found.");
        }

        setProduct({
          ...databaseProduct,
          category:
            databaseProduct.category?.name ||
            databaseProduct.category ||
            "Uncategorized",
          supplier:
            databaseProduct.supplier?.name ||
            databaseProduct.supplier ||
            "Not specified",
          quantity: Number(databaseProduct.quantity ?? 0),
          minStock: Number(databaseProduct.low_stock_threshold ?? 5),
          purchasePrice: Number(databaseProduct.purchase_price ?? 0),
          sellingPrice: Number(databaseProduct.selling_price ?? 0),
        });
      } catch (err) {
        setError(err.message || "Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProduct();
    } else {
      setError("Product ID is missing.");
      setIsLoading(false);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Package
          size={35}
          className="mx-auto mb-3 animate-pulse text-blue-600"
        />
        <p className="text-sm font-medium text-slate-600">
          Loading product details from your database...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />

          <h1 className="text-xl font-bold text-slate-900">
            Unable to Load Product
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "The requested product could not be found."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/stock")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={17} />
              Back to Stock
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPurchaseValue = product.quantity * product.purchasePrice;
  const totalSellingValue = product.quantity * product.sellingPrice;
  const possibleProfit = totalSellingValue - totalPurchaseValue;

  const stockStatus =
    product.quantity === 0
      ? "Out of Stock"
      : product.quantity <= product.minStock
        ? "Low Stock"
        : "In Stock";

  const statusClass =
    stockStatus === "Out of Stock"
      ? "bg-red-100 text-red-700"
      : stockStatus === "Low Stock"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  const addedDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString()
    : "Not available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-5xl space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard/stock"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            Back to Stock
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Package size={25} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Inventory Management
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Product Details
              </h1>
            </div>
          </div>
        </div>

        {!product.isPurchaseLinked && (
          <Link
            to={`/dashboard/stock/edit/${product.id}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Pencil size={17} />
            Edit Stock
          </Link>
        )}
      </div>

      {/* Product Information */}
      <div className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm">
        <div className="border-b border-[#e2e5f0] bg-[#f8f8ff] px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Product Name</p>

              <h2 className="mt-1 break-words text-2xl font-bold text-slate-950">
                {product.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {product.sku || "No SKU provided"}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusClass}`}
            >
              {stockStatus}
            </span>
          </div>

          {product.isPurchaseLinked && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This product is linked to a purchase record. Editing is disabled
              here to preserve purchase history.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <InfoCard
            icon={<Tag size={19} />}
            label="Category"
            value={product.category}
          />

          <InfoCard
            icon={<Truck size={19} />}
            label="Supplier"
            value={product.supplier}
          />

          <InfoCard
            icon={<Boxes size={19} />}
            label="SKU"
            value={product.sku || "Not provided"}
          />

          <InfoCard
            icon={<Package size={19} />}
            label="Available Quantity"
            value={`${product.quantity} units`}
          />

          <InfoCard
            icon={<ShoppingCart size={19} />}
            label="Minimum Stock Alert"
            value={`${product.minStock} units`}
          />

          <InfoCard
            icon={<CalendarDays size={19} />}
            label="Date Added"
            value={addedDate}
          />

          <InfoCard
            icon={<CalendarDays size={19} />}
            label="Product ID"
            value={String(product.id)}
          />

          {product.description && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </p>
              <p className="break-words text-sm leading-6 text-slate-800">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Pricing Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PriceCard label="Purchase Price" value={product.purchasePrice} />

            <PriceCard label="Selling Price" value={product.sellingPrice} />

            <PriceCard
              label="Possible Profit Per Unit"
              value={product.sellingPrice - product.purchasePrice}
              highlight
            />
          </div>
        </div>

        {/* Inventory Value */}
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Inventory Value
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              label="Total Purchase Value"
              value={totalPurchaseValue}
            />

            <ValueCard label="Total Selling Value" value={totalSellingValue} />

            <ValueCard
              label="Possible Total Profit"
              value={possibleProfit}
              highlight
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="mb-2 flex items-center gap-2 text-blue-600">
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
    </div>

    <p className="break-words text-base font-bold text-slate-900">{value}</p>
  </div>
);

const PriceCard = ({ label, value, highlight = false }) => (
  <div
    className={`rounded-xl border p-4 ${
      highlight
        ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-slate-50"
    }`}
  >
    <p className="text-sm font-medium text-slate-500">{label}</p>

    <p
      className={`mt-2 text-xl font-bold ${
        highlight ? "text-emerald-700" : "text-slate-900"
      }`}
    >
      {formatMoney(value)}
    </p>
  </div>
);

const ValueCard = ({ label, value, highlight = false }) => (
  <div
    className={`rounded-xl border p-4 ${
      highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
    }`}
  >
    <p className="text-sm font-medium text-slate-500">{label}</p>

    <p
      className={`mt-2 text-2xl font-bold ${
        highlight ? "text-blue-700" : "text-slate-900"
      }`}
    >
      {formatMoney(value)}
    </p>
  </div>
);

export default ViewStock;
