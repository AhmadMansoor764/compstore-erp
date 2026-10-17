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
import { useLanguage } from "../context/LanguageContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const ViewStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, direction } = useLanguage();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const locale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  const formatMoney = (value) =>
    `$${Number(value ?? 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => new Date(value).toLocaleDateString(locale);

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
          throw new Error(data.message || t("viewStock.loadError"));
        }

        const databaseProduct = data.product || data;

        if (!databaseProduct || databaseProduct.id == null) {
          throw new Error(t("viewStock.detailsNotFound"));
        }

        setProduct({
          ...databaseProduct,
          category:
            databaseProduct.category?.name ||
            databaseProduct.category ||
            t("viewStock.uncategorized"),
          supplier:
            databaseProduct.supplier?.name ||
            databaseProduct.supplier ||
            t("viewStock.notSpecified"),
          quantity: Number(databaseProduct.quantity ?? 0),
          minStock: Number(databaseProduct.low_stock_threshold ?? 5),
          purchasePrice: Number(databaseProduct.purchase_price ?? 0),
          sellingPrice: Number(databaseProduct.selling_price ?? 0),
        });
      } catch (err) {
        setError(err.message || t("viewStock.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProduct();
    } else {
      setError(t("viewStock.missingId"));
      setIsLoading(false);
    }
  }, [id, t]);

  if (isLoading) {
    return (
      <div
        dir={direction}
        className="rounded-2xl border border-slate-200 bg-white p-8 text-center"
      >
        <Package
          size={35}
          className="mx-auto mb-3 animate-pulse text-blue-600"
        />
        <p className="text-sm font-medium text-slate-600">
          {t("viewStock.loading")}
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div dir={direction} className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={42} className="mx-auto mb-4 text-red-500" />

          <h1 className="text-xl font-bold text-slate-900">
            {t("viewStock.unableToLoad")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || t("viewStock.productNotFound")}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/stock")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={17} />
              {t("viewStock.back")}
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("viewStock.tryAgain")}
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
      ? "outOfStock"
      : product.quantity <= product.minStock
        ? "lowStock"
        : "inStock";

  const statusClass =
    stockStatus === "outOfStock"
      ? "bg-red-100 text-red-700"
      : stockStatus === "lowStock"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  const addedDate = product.created_at
    ? formatDate(product.created_at)
    : t("viewStock.notAvailable");

  return (
    <motion.div
      dir={direction}
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
            {t("viewStock.back")}
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Package size={25} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                {t("viewStock.inventoryManagement")}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {t("viewStock.productDetails")}
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
            {t("viewStock.editStock")}
          </Link>
        )}
      </div>

      {/* Product Information */}
      <div className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm">
        <div className="border-b border-[#e2e5f0] bg-[#f8f8ff] px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t("viewStock.productName")}
              </p>

              <h2 className="mt-1 break-words text-2xl font-bold text-slate-950">
                {product.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {product.sku || t("viewStock.noSku")}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusClass}`}
            >
              {t(`viewStock.${stockStatus}`)}
            </span>
          </div>

          {product.isPurchaseLinked && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {t("viewStock.purchaseLinkedWarning")}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <InfoCard
            icon={<Tag size={19} />}
            label={t("viewStock.category")}
            value={product.category}
          />

          <InfoCard
            icon={<Truck size={19} />}
            label={t("viewStock.supplier")}
            value={product.supplier}
          />

          <InfoCard
            icon={<Boxes size={19} />}
            label="SKU"
            value={product.sku || t("viewStock.notProvided")}
          />

          <InfoCard
            icon={<Package size={19} />}
            label={t("viewStock.availableQuantity")}
            value={`${product.quantity} ${t("viewStock.units")}`}
          />

          <InfoCard
            icon={<ShoppingCart size={19} />}
            label={t("viewStock.minimumStockAlert")}
            value={`${product.minStock} ${t("viewStock.units")}`}
          />

          <InfoCard
            icon={<CalendarDays size={19} />}
            label={t("viewStock.dateAdded")}
            value={addedDate}
          />

          <InfoCard
            icon={<CalendarDays size={19} />}
            label={t("viewStock.productId")}
            value={String(product.id)}
          />

          {product.description && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("viewStock.description")}
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
            {t("viewStock.pricingInformation")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PriceCard
              label={t("viewStock.purchasePrice")}
              value={product.purchasePrice}
              formatMoney={formatMoney}
            />

            <PriceCard
              label={t("viewStock.sellingPrice")}
              value={product.sellingPrice}
              formatMoney={formatMoney}
            />

            <PriceCard
              label={t("viewStock.possibleProfitPerUnit")}
              value={product.sellingPrice - product.purchasePrice}
              formatMoney={formatMoney}
              highlight
            />
          </div>
        </div>

        {/* Inventory Value */}
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            {t("viewStock.inventoryValue")}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              label={t("viewStock.totalPurchaseValue")}
              value={totalPurchaseValue}
              formatMoney={formatMoney}
            />

            <ValueCard
              label={t("viewStock.totalSellingValue")}
              value={totalSellingValue}
              formatMoney={formatMoney}
            />

            <ValueCard
              label={t("viewStock.possibleTotalProfit")}
              value={possibleProfit}
              formatMoney={formatMoney}
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

const PriceCard = ({ label, value, formatMoney, highlight = false }) => (
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

const ValueCard = ({ label, value, formatMoney, highlight = false }) => (
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
