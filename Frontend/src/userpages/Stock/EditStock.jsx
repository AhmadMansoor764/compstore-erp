import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  Save,
  X,
  Tag,
  Truck,
  Hash,
  Layers3,
  DollarSign,
  FileText,
  CircleAlert,
  LoaderCircle,
  Info,
  Package,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const emptyForm = {
  name: "",
  sku: "",
  category_id: "",
  supplier_id: "",
  quantity: "",
  minStock: "",
  purchasePrice: "",
  sellingPrice: "",
  description: "",
};

const EditStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, direction } = useLanguage();

  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const [productResponse, optionsResponse] = await Promise.all([
          fetch(`${API_URL}/products/${id}`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/products/form-options`, {
            credentials: "include",
          }),
        ]);

        const productData = await productResponse.json();
        const optionsData = await optionsResponse.json();

        if (!productResponse.ok) {
          throw new Error(
            productData.message || t("editStock.errors.failedLoadThisProduct"),
          );
        }

        if (!optionsResponse.ok) {
          throw new Error(
            optionsData.message || t("editStock.errors.failedLoadOptions"),
          );
        }

        const product = productData.product || productData;

        if (!product || product.id == null) {
          throw new Error(t("editStock.errors.notFound"));
        }

        if (cancelled) return;

        setCategories(optionsData.categories || []);
        setSuppliers(optionsData.suppliers || []);

        setFormData({
          name: product.name || "",
          sku: product.sku || "",
          category_id: String(
            product.category_id ?? product.category?.id ?? "",
          ),
          supplier_id: String(
            product.supplier_id ?? product.supplier?.id ?? "",
          ),
          quantity: String(product.quantity ?? 0),
          minStock: String(product.low_stock_threshold ?? 5),
          purchasePrice: String(product.purchase_price ?? 0),
          sellingPrice: String(product.selling_price ?? 0),
          description: product.description || "",
        });
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || t("editStock.errors.failedLoad"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const {
      name,
      sku,
      category_id,
      supplier_id,
      quantity,
      minStock,
      purchasePrice,
      sellingPrice,
      description,
    } = formData;

    if (
      !name.trim() ||
      !category_id ||
      quantity === "" ||
      minStock === "" ||
      purchasePrice === "" ||
      sellingPrice === ""
    ) {
      toast.error(t("editStock.validation.fillRequired"));
      return;
    }

    const quantityValue = Number(quantity);
    const minStockValue = Number(minStock);
    const purchasePriceValue = Number(purchasePrice);
    const sellingPriceValue = Number(sellingPrice);

    if (
      !Number.isInteger(quantityValue) ||
      !Number.isInteger(minStockValue) ||
      quantityValue < 0 ||
      minStockValue < 0
    ) {
      toast.error(t("editStock.validation.quantity"));
      return;
    }

    if (
      !Number.isFinite(purchasePriceValue) ||
      !Number.isFinite(sellingPriceValue) ||
      purchasePriceValue < 0 ||
      sellingPriceValue < 0
    ) {
      toast.error(t("editStock.validation.prices"));
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(purchasePrice) ||
      !/^\d+(\.\d{1,2})?$/.test(sellingPrice)
    ) {
      toast.error(t("editStock.validation.priceDecimals"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          category_id: Number(category_id),
          supplier_id: supplier_id ? Number(supplier_id) : null,
          quantity: quantityValue,
          low_stock_threshold: minStockValue,
          purchase_price: purchasePriceValue,
          selling_price: sellingPriceValue,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t("editStock.errors.failedUpdateProduct"),
        );
      }

      toast.success(data.message || t("editStock.success.stockUpdated"));

      navigate("/dashboard/stock");
    } catch (error) {
      toast.error(error.message || t("editStock.errors.failedUpdateStock"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedProfit =
    formData.purchasePrice !== "" && formData.sellingPrice !== ""
      ? Number(formData.sellingPrice) - Number(formData.purchasePrice)
      : null;

  const estimatedMargin =
    estimatedProfit !== null && Number(formData.sellingPrice) > 0
      ? (estimatedProfit / Number(formData.sellingPrice)) * 100
      : null;

  const numberLocale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString(numberLocale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(formData.category_id),
  );

  const selectedSupplier = suppliers.find(
    (supplier) => String(supplier.id) === String(formData.supplier_id),
  );

  if (isLoading) {
    return (
      <div className="es-page" dir={direction}>
        <style>{EDIT_STOCK_CSS}</style>

        <div className="es-state-card">
          <div className="es-loader-icon">
            <LoaderCircle size={25} className="es-spin" />
          </div>

          <h2>{t("editStock.loading.title")}</h2>

          <p>{t("editStock.loading.description")}</p>

          <div className="es-loading-track">
            <div />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="es-page" dir={direction}>
        <style>{EDIT_STOCK_CSS}</style>

        <div className="es-state-card">
          <div className="es-error-icon">
            <AlertTriangle size={25} />
          </div>

          <h2>{t("editStock.errors.title")}</h2>

          <p className="es-error-message">{loadError}</p>

          <button
            type="button"
            onClick={() => navigate("/dashboard/stock")}
            className="es-primary-button mt-5"
          >
            <ArrowLeft size={17} />
            {t("editStock.backToStock")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="es-page mx-auto w-full max-w-6xl"
      dir={direction}
    >
      <style>{EDIT_STOCK_CSS}</style>

      {/* Page heading */}
      <div className="mb-6">
        <Link to="/dashboard/stock" className="es-back-link mb-5">
          <ArrowLeft size={16} />
          {t("editStock.backToInventory")}
        </Link>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="es-eyebrow mb-2">
              <Sparkles size={13} />
              {t("editStock.inventoryManagement")}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#182338] sm:text-3xl">
              {t("editStock.title")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718096]">
              {t("editStock.description")}
            </p>
          </div>

          <div className="es-product-badge self-start sm:self-auto">
            <div className="es-product-badge-icon">
              <Package size={17} />
            </div>

            <div>
              <p>{t("editStock.editingProduct")}</p>
              <span>{formData.sku.trim() || `Product #${id}`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product summary */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Package}
          label={t("editStock.summary.product")}
          value={formData.name || t("editStock.unnamedProduct")}
          subtitle={t("editStock.summary.inventoryItem")}
          color="indigo"
        />

        <SummaryCard
          icon={Tag}
          label={t("editStock.summary.category")}
          value={selectedCategory?.name || t("editStock.notSelected")}
          subtitle={t("editStock.summary.productClassification")}
          color="blue"
        />

        <SummaryCard
          icon={Truck}
          label={t("editStock.summary.supplier")}
          value={selectedSupplier?.name || t("editStock.noSupplier")}
          subtitle={t("editStock.summary.supplyInformation")}
          color="emerald"
        />
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit} className="es-panel">
        <div className="es-panel-head">
          <div className="es-heading-icon">
            <Boxes size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h2>{t("editStock.productInformation")}</h2>
            <p>{t("editStock.modifyProduct")}</p>
          </div>

          <span className="es-status-badge">
            <span />
            {t("editStock.editing")}
          </span>
        </div>

        <div className="space-y-7 p-5 sm:p-7">
          {/* Section 1 */}
          <section className="es-section">
            <SectionHeading
              number="01"
              title={t("editStock.sections.basicDetails")}
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <FormField
                label={t("editStock.fields.productName")}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.productName")}
                required
                icon={Package}
              />

              <FormField
                label={t("editStock.fields.sku")}
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.sku")}
                icon={Hash}
              />

              {/* Category */}
              <div>
                <label htmlFor="category_id" className="es-label">
                  {t("editStock.fields.category")}{" "}
                  <span className="es-required">*</span>
                </label>

                <div className="es-input-wrapper">
                  <Layers3 size={17} className="es-input-icon" />

                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="es-input es-input-with-icon es-select"
                  >
                    <option value="">{t("editStock.selectCategory")}</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="es-help">{t("editStock.help.chooseCategory")}</p>
              </div>

              {/* Supplier */}
              <div>
                <label htmlFor="supplier_id" className="es-label">
                  {t("editStock.fields.supplier")}{" "}
                  <span className="es-optional">{t("editStock.optional")}</span>
                </label>

                <div className="es-input-wrapper">
                  <Truck size={17} className="es-input-icon" />

                  <select
                    id="supplier_id"
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleChange}
                    className="es-input es-input-with-icon es-select"
                  >
                    <option value="">{t("editStock.noSupplier")}</option>

                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="es-help">{t("editStock.help.linkSupplier")}</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="es-label">
                  {t("editStock.fields.description")}{" "}
                  <span className="es-optional">{t("editStock.optional")}</span>
                </label>

                <div className="es-input-wrapper">
                  <FileText size={17} className="es-textarea-icon" />

                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t("editStock.placeholders.description")}
                    className="es-input es-textarea es-textarea-with-icon"
                  />
                </div>

                <p className="es-help">{t("editStock.help.description")}</p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="es-section">
            <SectionHeading
              number="02"
              title={t("editStock.sections.stockDetails")}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label={t("editStock.fields.quantity")}
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.quantity")}
                required
                icon={Boxes}
              />

              <FormField
                label={t("editStock.fields.minimumStockAlert")}
                name="minStock"
                type="number"
                min="0"
                step="1"
                value={formData.minStock}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.minStock")}
                required
                icon={CircleAlert}
              />
            </div>

            <div className="es-info-box mt-5">
              <div className="es-info-icon">
                <Info size={16} />
              </div>

              <p>
                <strong>{t("editStock.inventoryTip.title")}</strong>
                <span>{t("editStock.inventoryTip.description")}</span>
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="es-section">
            <SectionHeading
              number="03"
              title={t("editStock.sections.pricing")}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label={t("editStock.fields.purchasePrice")}
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.purchasePrice")}
                required
                icon={DollarSign}
              />

              <FormField
                label={t("editStock.fields.sellingPrice")}
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder={t("editStock.placeholders.sellingPrice")}
                required
                icon={DollarSign}
              />
            </div>

            {estimatedProfit !== null && (
              <div className="es-profit-panel mt-5">
                <div className="flex items-start gap-3">
                  <div className="es-profit-icon">
                    <DollarSign size={18} />
                  </div>

                  <div>
                    <p className="es-profit-label">
                      {t("editStock.estimatedProfit")}
                    </p>

                    <p
                      className={`mt-1 text-2xl font-extrabold tracking-tight ${
                        estimatedProfit >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {estimatedProfit < 0 ? "−" : ""}
                      {formatMoney(Math.abs(estimatedProfit))}
                    </p>

                    <p className="mt-1 text-[11px] text-[#8995a7]">
                      {t("editStock.sellingMinusPurchase")}
                    </p>
                  </div>
                </div>

                {estimatedMargin !== null && (
                  <div
                    className={`es-margin-badge ${
                      estimatedMargin >= 0
                        ? "es-margin-positive"
                        : "es-margin-negative"
                    }`}
                  >
                    {estimatedMargin.toFixed(1)}% {t("editStock.margin")}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="es-footer">
          <div className="es-footer-note">
            <CheckCircle2 size={16} />
            {t("editStock.saveNote")}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link to="/dashboard/stock" className="es-secondary-button">
              <X size={16} />
              {t("editStock.cancel")}
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="es-primary-button"
            >
              {isSubmitting ? (
                <LoaderCircle size={17} className="es-spin" />
              ) : (
                <Save size={17} />
              )}

              {isSubmitting
                ? t("editStock.saving")
                : t("editStock.saveChanges")}
            </button>
          </div>
        </div>
      </form>

      <p className="mt-4 flex items-center justify-center gap-2 pb-2 text-center text-[10px] text-[#9aa5b5]">
        <Info size={13} />
        {t("editStock.requiredNotePrefix")}{" "}
        <span className="text-rose-500">*</span>{" "}
        {t("editStock.requiredNoteSuffix")}
      </p>
    </motion.div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="es-summary-card">
    <div className={`es-summary-icon es-${color}`}>
      <Icon size={17} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="es-summary-label">{label}</p>
      <p className="es-summary-value" title={value}>
        {value}
      </p>
      <p className="es-summary-subtitle">{subtitle}</p>
    </div>
  </div>
);

const SectionHeading = ({ number, title }) => (
  <h3 className="es-section-heading">
    <span>{number}</span>
    {title}
  </h3>
);

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
  required = false,
  icon: Icon,
}) => {
  const { t } = useLanguage();

  return (
    <div>
      <label htmlFor={name} className="es-label">
        {label}
        {required ? (
          <span className="es-required">*</span>
        ) : (
          <span className="es-optional">{t("editStock.optional")}</span>
        )}
      </label>

      <div className="es-input-wrapper">
        {Icon && <Icon size={17} className="es-input-icon" />}

        <input
          id={name}
          name={name}
          type={type}
          min={min}
          step={step}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`es-input ${Icon ? "es-input-with-icon" : ""}`}
        />
      </div>
    </div>
  );
};

const EDIT_STOCK_CSS = `
  .es-page {
    --es-ink: #182338;
    --es-muted: #718096;
    --es-line: #e5eaf2;
    --es-indigo: #4f46e5;
    color: var(--es-ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .es-page * { box-sizing: border-box; }

  .es-page .es-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    color: #4f46e5; font-size: 11px; font-weight: 800;
    letter-spacing: .13em; text-transform: uppercase;
  }
  .es-page .es-back-link {
    display: inline-flex; align-items: center; gap: 8px;
    color: #64748b; font-size: 13px; font-weight: 700;
    transition: color .2s, transform .2s;
  }
  .es-page .es-back-link:hover {
    color: #4338ca; transform: translateX(-2px);
  }

  .es-page .es-product-badge {
    display: flex; align-items: center; gap: 10px;
    max-width: 100%; padding: 10px 14px; border: 1px solid #e5eaf2;
    border-radius: 14px; background: #fff;
  }
  .es-page .es-product-badge-icon {
    display: flex; width: 35px; height: 35px; align-items: center;
    justify-content: center; border-radius: 11px;
    background: #eef2ff; color: #4f46e5;
  }
  .es-page .es-product-badge p {
    color: #8995a7; font-size: 10px; font-weight: 700;
  }
  .es-page .es-product-badge span {
    display: block; max-width: 210px; overflow: hidden;
    margin-top: 3px; color: #273449; font-size: 12px;
    font-weight: 800; text-overflow: ellipsis; white-space: nowrap;
  }

  .es-page .es-summary-card {
    display: flex; min-width: 0; align-items: flex-start; gap: 12px;
    padding: 17px; border: 1px solid #e5eaf2; border-radius: 17px;
    background: #fff; box-shadow: 0 5px 18px rgba(15,23,42,.025);
  }
  .es-page .es-summary-icon {
    display: flex; width: 39px; height: 39px; flex: 0 0 auto;
    align-items: center; justify-content: center; border-radius: 12px;
  }
  .es-page .es-indigo { color: #4f46e5; background: #eef2ff; }
  .es-page .es-blue { color: #2563eb; background: #eff6ff; }
  .es-page .es-emerald { color: #059669; background: #ecfdf5; }
  .es-page .es-summary-label {
    color: #8491a4; font-size: 10px; font-weight: 750;
    letter-spacing: .07em; text-transform: uppercase;
  }
  .es-page .es-summary-value {
    overflow: hidden; margin-top: 4px; color: #263449;
    font-size: 13px; font-weight: 850; text-overflow: ellipsis;
    white-space: nowrap;
  }
  .es-page .es-summary-subtitle {
    margin-top: 4px; color: #9aa5b5; font-size: 10px;
  }

  .es-page .es-panel {
    overflow: hidden; border: 1px solid var(--es-line);
    border-radius: 22px; background: #fff;
    box-shadow: 0 8px 30px rgba(15,23,42,.035);
  }
  .es-page .es-panel-head {
    display: flex; align-items: center; gap: 13px;
    padding: 22px 25px; border-bottom: 1px solid #edf0f5;
    background: linear-gradient(110deg,#fbfcff,#f8faff);
  }
  .es-page .es-heading-icon {
    display: flex; width: 43px; height: 43px; flex: 0 0 auto;
    align-items: center; justify-content: center; border-radius: 14px;
    color: #4f46e5; background: #eef2ff; border: 1px solid #e0e7ff;
  }
  .es-page .es-panel-head h2 {
    color: #1e293b; font-size: 15px; font-weight: 850;
  }
  .es-page .es-panel-head p {
    margin-top: 4px; color: #7b8798; font-size: 11px; line-height: 1.6;
  }
  .es-page .es-status-badge {
    display: inline-flex; flex: 0 0 auto; align-items: center; gap: 7px;
    border: 1px solid #e0e7ff; border-radius: 999px;
    padding: 7px 10px; color: #4f46e5; background: #fff;
    font-size: 10px; font-weight: 800;
  }
  .es-page .es-status-badge span {
    width: 6px; height: 6px; border-radius: 50%; background: #818cf8;
  }

  .es-page .es-section {
    padding-top: 26px; border-top: 1px solid #edf0f5;
  }
  .es-page .es-section:first-child {
    padding-top: 0; border-top: 0;
  }
  .es-page .es-section-heading {
    display: flex; align-items: center; gap: 10px;
    margin: 0 0 19px; color: #1e293b;
    font-size: 14px; font-weight: 850;
  }
  .es-page .es-section-heading > span {
    display: flex; width: 29px; height: 29px; align-items: center;
    justify-content: center; border: 1px solid #e5eaf2;
    border-radius: 9px; color: #64748b; background: #f8fafc;
    font-size: 10px; font-weight: 850;
  }

  .es-page .es-label {
    display: flex; align-items: center; gap: 5px;
    margin-bottom: 9px; color: #344256;
    font-size: 12px; font-weight: 750;
  }
  .es-page .es-required { color: #ef4444; }
  .es-page .es-optional {
    margin-left: 4px; color: #94a3b8;
    font-size: 10px; font-weight: 650;
  }
  .es-page .es-input-wrapper { position: relative; }
  .es-page .es-input-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); color: #94a3b8;
    pointer-events: none;
  }
  .es-page .es-input {
    display: block; width: 100%; height: 47px;
    border: 1px solid #dfe5ef; border-radius: 12px;
    outline: none; padding: 0 14px; background: #fff;
    color: #182338; font: inherit; font-size: 13px;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .es-page .es-input::placeholder { color: #a2adbd; }
  .es-page .es-input:focus {
    border-color: #818cf8; box-shadow: 0 0 0 4px rgba(99,102,241,.11);
  }
  .es-page .es-input-with-icon { padding-left: 42px; }
  .es-page .es-select {
    appearance: none; padding-right: 35px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 13px center;
  }
  .es-page .es-textarea-icon {
    position: absolute; left: 14px; top: 15px;
    color: #94a3b8; pointer-events: none;
  }
  .es-page .es-textarea {
    height: auto; min-height: 112px; padding: 13px 14px;
    resize: vertical; line-height: 1.65;
  }
  .es-page .es-textarea-with-icon { padding-left: 42px; }
  .es-page .es-help {
    margin-top: 7px; color: #8b97a9;
    font-size: 11px; line-height: 1.6;
  }

  .es-page .es-info-box {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 14px 15px; border: 1px solid #e0e7ff;
    border-radius: 14px; background: #f7f8ff;
  }
  .es-page .es-info-icon {
    display: flex; width: 27px; height: 27px; flex: 0 0 auto;
    align-items: center; justify-content: center;
    border-radius: 9px; color: #4f46e5; background: #e9edff;
  }
  .es-page .es-info-box p { min-width: 0; }
  .es-page .es-info-box strong {
    display: block; color: #46536b; font-size: 11px; font-weight: 850;
  }
  .es-page .es-info-box span {
    display: block; margin-top: 4px; color: #77839a;
    font-size: 11px; line-height: 1.65;
  }

  .es-page .es-profit-panel {
    display: flex; align-items: center; justify-content: space-between;
    gap: 15px; padding: 17px; border: 1px solid #e3e8f3;
    border-radius: 16px; background: linear-gradient(120deg,#fbfcff,#f8faff);
  }
  .es-page .es-profit-icon {
    display: flex; width: 40px; height: 40px; flex: 0 0 auto;
    align-items: center; justify-content: center; border-radius: 12px;
    color: #059669; background: #ecfdf5;
  }
  .es-page .es-profit-label {
    color: #7b8798; font-size: 11px; font-weight: 750;
  }
  .es-page .es-margin-badge {
    border-radius: 10px; padding: 8px 11px;
    font-size: 11px; font-weight: 850; white-space: nowrap;
  }
  .es-page .es-margin-positive {
    border: 1px solid #d1fae5; color: #047857; background: #ecfdf5;
  }
  .es-page .es-margin-negative {
    border: 1px solid #ffe4e6; color: #be123c; background: #fff1f2;
  }

  .es-page .es-footer {
    display: flex; flex-wrap: wrap; align-items: center;
    justify-content: space-between; gap: 15px; padding: 19px 25px;
    border-top: 1px solid #edf0f5; background: #fbfcfe;
  }
  .es-page .es-footer-note {
    display: flex; align-items: center; gap: 8px;
    color: #7b8798; font-size: 11px;
  }
  .es-page .es-footer-note svg { color: #10b981; }
  .es-page .es-primary-button,
  .es-page .es-secondary-button {
    display: inline-flex; min-height: 46px; align-items: center;
    justify-content: center; gap: 9px; border: 1px solid transparent;
    border-radius: 13px; padding: 0 18px;
    font-size: 12px; font-weight: 800; text-decoration: none;
    transition: background .2s, transform .2s, box-shadow .2s;
  }
  .es-page .es-primary-button {
    border-color: #4f46e5; color: #fff; background: #4f46e5;
    box-shadow: 0 7px 16px rgba(79,70,229,.18);
  }
  .es-page .es-primary-button:hover:not(:disabled) {
    transform: translateY(-1px); background: #4338ca;
    box-shadow: 0 10px 20px rgba(79,70,229,.23);
  }
  .es-page .es-primary-button:disabled {
    cursor: not-allowed; opacity: .58; box-shadow: none;
  }
  .es-page .es-secondary-button {
    border-color: #e0e6ef; color: #475569; background: #fff;
  }
  .es-page .es-secondary-button:hover {
    border-color: #cbd5e1; background: #f8fafc;
  }

  .es-page .es-state-card {
    display: flex; min-height: 290px; flex-direction: column;
    align-items: center; justify-content: center; padding: 35px 22px;
    border: 1px solid #e5eaf2; border-radius: 22px;
    background: #fff; text-align: center;
    box-shadow: 0 8px 30px rgba(15,23,42,.035);
  }
  .es-page .es-loader-icon,
  .es-page .es-error-icon {
    display: flex; width: 54px; height: 54px; align-items: center;
    justify-content: center; border-radius: 17px; margin-bottom: 16px;
  }
  .es-page .es-loader-icon { color: #4f46e5; background: #eef2ff; }
  .es-page .es-error-icon { color: #e11d48; background: #fff1f2; }
  .es-page .es-state-card h2 {
    color: #1e293b; font-size: 17px; font-weight: 850;
  }
  .es-page .es-state-card > p {
    max-width: 400px; margin-top: 7px; color: #7b8798;
    font-size: 12px; line-height: 1.7;
  }
  .es-page .es-state-card .es-error-message { color: #e11d48; }
  .es-page .es-loading-track {
    width: min(260px, 100%); height: 4px; overflow: hidden;
    margin-top: 23px; border-radius: 99px; background: #eef2ff;
  }
  .es-page .es-loading-track div {
    width: 40%; height: 100%; border-radius: 99px;
    background: #6366f1; animation: es-loading 1.2s ease-in-out infinite alternate;
  }
  .es-page .es-spin { animation: es-spin 1s linear infinite; }

  @keyframes es-spin { to { transform: rotate(360deg); } }
  @keyframes es-loading {
    from { transform: translateX(0); }
    to { transform: translateX(150%); }
  }

  @media (max-width: 640px) {
    .es-page .es-panel { border-radius: 17px; }
    .es-page .es-panel-head { padding: 17px; }
    .es-page .es-panel-head h2 { font-size: 14px; }
    .es-page .es-panel-head p { font-size: 10px; }
    .es-page .es-status-badge { padding: 6px 8px; font-size: 9px; }
    .es-page .es-footer { align-items: stretch; flex-direction: column; padding: 16px 18px; }
    .es-page .es-footer > div:last-child { display: flex; flex-direction: column-reverse; }
    .es-page .es-primary-button,
    .es-page .es-secondary-button { width: 100%; }
    .es-page .es-profit-panel { align-items: flex-start; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .es-page *, .es-page *::before, .es-page *::after {
      animation-duration: .01ms !important;
      transition-duration: .01ms !important;
    }
  }
`;

export default EditStock;
