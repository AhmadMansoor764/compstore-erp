import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  Save,
  X,
  Search,
  Plus,
  ChevronDown,
  Check,
  Package,
  Tag,
  Truck,
  Hash,
  Layers3,
  DollarSign,
  ShoppingBag,
  Info,
  LoaderCircle,
  FileText,
  CircleAlert,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const initialForm = {
  name: "",
  sku: "",
  quantity: "",
  minStock: "5",
  purchasePrice: "",
  sellingPrice: "",
  description: "",
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -5, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.16 },
  },
  exit: { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.1 } },
};

const AddStock = () => {
  const navigate = useNavigate();
  const { t, language, direction } = useLanguage();

  const categoryRef = useRef(null);
  const supplierRef = useRef(null);
  const productRef = useRef(null);

  const [formData, setFormData] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState(null);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);

  const money = (value) => {
    const locale =
      language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

    return Number(value || 0).toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const response = await fetch(`${API_URL}/products/form-options`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t("addStock.errors.loadOptions"));
        }

        setCategories(data.categories || []);
        setSuppliers(data.suppliers || []);
      } catch (error) {
        toast.error(error.message || t("addStock.errors.loadOptionsFallback"));
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadFormOptions();
  }, [t]);

  useEffect(() => {
    const loadPurchaseItems = async () => {
      try {
        const response = await fetch(`${API_URL}/purchases`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t("addStock.errors.loadPurchases"));
        }

        const purchases = Array.isArray(data) ? data : data.purchases || [];

        const items = purchases.flatMap((purchase) =>
          (purchase.items || []).map((item) => ({
            ...item,
            purchase_number: purchase.purchase_number,
            supplier: purchase.supplier,
            purchase_id: purchase.id,
          })),
        );

        setPurchaseItems(items);
      } catch (error) {
        toast.error(
          error.message || t("addStock.errors.loadPurchasesFallback"),
        );
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    loadPurchaseItems();
  }, [t]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }

      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setSupplierOpen(false);
      }

      if (productRef.current && !productRef.current.contains(event.target)) {
        setProductSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setCategoryOpen(false);
        setSupplierOpen(false);
        setProductSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredPurchaseItems = purchaseItems.filter((item) => {
    const query = productSearch.trim().toLowerCase();

    const remainingQuantity =
      Number(item.quantity || 0) - Number(item.quantity_added_to_stock || 0);

    return (
      query &&
      remainingQuantity > 0 &&
      String(item.product_name || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const handleProductSearch = (event) => {
    const value = event.target.value;

    setProductSearch(value);
    setSelectedPurchaseItem(null);

    setFormData((current) => ({
      ...current,
      name: value,
    }));

    setProductSearchOpen(true);
  };

  const handleSelectPurchaseItem = (item) => {
    const remainingQuantity =
      Number(item.quantity || 0) - Number(item.quantity_added_to_stock || 0);

    setSelectedPurchaseItem(item);
    setProductSearch(item.product_name || "");
    setProductSearchOpen(false);

    setFormData((current) => ({
      ...current,
      name: item.product_name || "",
      purchasePrice: String(item.unit_price ?? ""),
      quantity: String(remainingQuantity),
    }));

    if (item.supplier) {
      setSelectedSupplier(item.supplier);
      setSupplierSearch(item.supplier.name || "");
    }

    toast.success(t("addStock.success.purchaseSelected"));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const filteredCategories = categories.filter((category) =>
    String(category.name || "")
      .toLowerCase()
      .includes(categorySearch.trim().toLowerCase()),
  );

  const exactCategoryExists = categories.some(
    (category) =>
      String(category.name || "")
        .trim()
        .toLowerCase() === categorySearch.trim().toLowerCase(),
  );

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = supplierSearch.trim().toLowerCase();

    return (
      String(supplier.name || "")
        .toLowerCase()
        .includes(query) ||
      String(supplier.company_name || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const handleCategoryInput = (event) => {
    setCategorySearch(event.target.value);
    setSelectedCategory(null);
    setCategoryOpen(true);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setCategorySearch(category.name);
    setCategoryOpen(false);
  };

  const handleCreateCategory = async () => {
    const name = categorySearch.trim();

    if (!name || isCreatingCategory) return;

    const existingCategory = categories.find(
      (category) =>
        String(category.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase(),
    );

    if (existingCategory) {
      handleSelectCategory(existingCategory);
      return;
    }

    setIsCreatingCategory(true);

    try {
      const response = await fetch(`${API_URL}/products/categories`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("addStock.errors.createCategory"));
      }

      if (!data.category) {
        throw new Error(t("addStock.errors.serverCategory"));
      }

      setCategories((current) => {
        const alreadyAdded = current.some(
          (category) => category.id === data.category.id,
        );

        return alreadyAdded ? current : [...current, data.category];
      });

      setSelectedCategory(data.category);
      setCategorySearch(data.category.name);
      setCategoryOpen(false);

      toast.success(data.message || t("addStock.success.categorySaved"));
    } catch (error) {
      toast.error(error.message || t("addStock.errors.createCategory"));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setSupplierOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      name,
      sku,
      quantity,
      minStock,
      purchasePrice,
      sellingPrice,
      description,
    } = formData;

    if (
      !name.trim() ||
      !selectedCategory ||
      quantity === "" ||
      minStock === "" ||
      purchasePrice === "" ||
      sellingPrice === ""
    ) {
      toast.error(t("addStock.validation.required"));
      return;
    }

    const numericValues = [
      Number(quantity),
      Number(minStock),
      Number(purchasePrice),
      Number(sellingPrice),
    ];

    if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error(t("addStock.validation.numbers"));
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      !Number.isInteger(Number(minStock))
    ) {
      toast.error(t("addStock.validation.integers"));
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(purchasePrice) ||
      !/^\d+(\.\d{1,2})?$/.test(sellingPrice)
    ) {
      toast.error(t("addStock.validation.decimals"));
      return;
    }

    if (selectedPurchaseItem) {
      const remaining =
        Number(selectedPurchaseItem.quantity || 0) -
        Number(selectedPurchaseItem.quantity_added_to_stock || 0);

      if (remaining <= 0) {
        toast.error(t("addStock.validation.noRemaining"));
        return;
      }

      if (Number(quantity) !== remaining) {
        toast.error(
          t("addStock.validation.remainingQuantity").replace(
            "{quantity}",
            String(remaining),
          ),
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint = selectedPurchaseItem
        ? `${API_URL}/products/from-purchase`
        : `${API_URL}/products`;

      const payload = selectedPurchaseItem
        ? {
            purchase_item_id: selectedPurchaseItem.id,
            category_id: selectedCategory.id,
            sku: sku.trim(),
            low_stock_threshold: Number(minStock),
            selling_price: Number(sellingPrice),
            description: description.trim() || undefined,
          }
        : {
            name: name.trim(),
            sku: sku.trim(),
            category_id: selectedCategory.id,
            supplier_id: selectedSupplier?.id ?? null,
            quantity: Number(quantity),
            low_stock_threshold: Number(minStock),
            purchase_price: Number(purchasePrice),
            selling_price: Number(sellingPrice),
            description: description.trim() || undefined,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("addStock.errors.saveStock"));
      }

      toast.success(data.message || t("addStock.success.stockAdded"));
      navigate("/dashboard/stock");
    } catch (error) {
      toast.error(error.message || t("addStock.errors.saveStockFallback"));
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

  return (
    <motion.div
      dir={direction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="as-page mx-auto w-full max-w-6xl"
    >
      <style>{`
        .as-page {
          --as-ink: #182338;
          --as-muted: #718096;
          --as-line: #e5eaf2;
          --as-blue: #4f46e5;
          --as-blue-dark: #3730a3;
          --as-surface: #ffffff;
          color: var(--as-ink);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .as-page * { box-sizing: border-box; }
        .as-page .as-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: #4f46e5; font-size: 11px; font-weight: 800;
          letter-spacing: .13em; text-transform: uppercase;
        }
        .as-page .as-back {
          display: inline-flex; align-items: center; gap: 8px;
          color: #64748b; font-size: 13px; font-weight: 700;
          transition: color .2s, transform .2s;
        }
        .as-page .as-back:hover { color: #4338ca; transform: translateX(-2px); }
        .as-page .as-primary {
          display: inline-flex; min-height: 46px; align-items: center;
          justify-content: center; gap: 9px; border: 1px solid #4f46e5;
          border-radius: 13px; padding: 0 19px; background: #4f46e5;
          color: #fff; font-size: 13px; font-weight: 750;
          box-shadow: 0 7px 16px rgba(79,70,229,.18);
          transition: background .2s, transform .2s, box-shadow .2s;
        }
        .as-page .as-primary:hover:not(:disabled) {
          background: #4338ca; box-shadow: 0 10px 20px rgba(79,70,229,.24);
          transform: translateY(-1px);
        }
        .as-page .as-primary:disabled { opacity: .58; cursor: not-allowed; box-shadow: none; }
        .as-page .as-secondary {
          display: inline-flex; min-height: 46px; align-items: center;
          justify-content: center; gap: 8px; border: 1px solid #e0e6ef;
          border-radius: 13px; padding: 0 17px; background: #fff;
          color: #475569; font-size: 13px; font-weight: 750;
          transition: background .2s, border-color .2s;
        }
        .as-page .as-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
        .as-page .as-panel {
          overflow: visible; border: 1px solid var(--as-line);
          border-radius: 22px; background: var(--as-surface);
          box-shadow: 0 8px 30px rgba(15,23,42,.035);
        }
        .as-page .as-panel-head {
          display: flex; align-items: center; gap: 13px;
          padding: 22px 25px; border-bottom: 1px solid #edf0f5;
          background: linear-gradient(110deg,#fbfcff,#f8faff);
          border-radius: 22px 22px 0 0;
        }
        .as-page .as-icon-box {
          display: flex; width: 43px; height: 43px; flex: 0 0 auto;
          align-items: center; justify-content: center; border-radius: 14px;
          color: #4f46e5; background: #eef2ff;
          border: 1px solid #e0e7ff;
        }
        .as-page .as-field-label {
          display: flex; align-items: center; gap: 5px; margin-bottom: 9px;
          color: #344256; font-size: 12px; font-weight: 750;
        }
        .as-page .as-required { color: #ef4444; }
        .as-page .as-optional {
          margin-left: 4px; color: #94a3b8; font-size: 10px; font-weight: 650;
        }
        .as-page .as-input-wrap { position: relative; }
        .as-page .as-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .as-page .as-input {
          display: block; width: 100%; height: 47px; border: 1px solid #dfe5ef;
          border-radius: 12px; outline: none; padding: 0 14px;
          background: #fff; color: #182338; font: inherit; font-size: 13px;
          transition: border-color .18s, box-shadow .18s, background .18s;
        }
        .as-page .as-input::placeholder { color: #a2adbd; }
        .as-page .as-input:focus {
          border-color: #818cf8; box-shadow: 0 0 0 4px rgba(99,102,241,.11);
          background: #fff;
        }
        .as-page .as-input.as-with-icon { padding-left: 42px; }
        .as-page textarea.as-input {
          height: auto; min-height: 100px; padding: 13px 14px; resize: vertical;
          line-height: 1.65;
        }
        .as-page .as-field-help { margin-top: 7px; color: #8b97a9; font-size: 11px; line-height: 1.6; }
        .as-page .as-section-title {
          display: flex; align-items: center; gap: 10px;
          margin: 0 0 18px; color: #1e293b; font-size: 14px; font-weight: 800;
        }
        .as-page .as-section-number {
          display: flex; width: 27px; height: 27px; align-items: center;
          justify-content: center; border-radius: 9px; background: #f1f5f9;
          color: #64748b; font-size: 11px; font-weight: 850;
        }
        .as-page .as-section {
          padding-top: 24px; border-top: 1px solid #edf0f5;
        }
        .as-page .as-section:first-child { padding-top: 0; border-top: 0; }
        .as-page .as-dropdown {
          position: absolute; z-index: 50; top: calc(100% + 8px); left: 0;
          width: 100%; max-height: 260px; overflow-y: auto; padding: 6px;
          border: 1px solid #e1e7f0; border-radius: 15px; background: #fff;
          box-shadow: 0 18px 40px rgba(15,23,42,.13);
        }
        .as-page .as-option {
          display: flex; width: 100%; align-items: flex-start; gap: 10px;
          border: 0; border-radius: 10px; padding: 11px 10px;
          text-align: left; background: transparent; cursor: pointer;
          transition: background .15s;
        }
        .as-page .as-option:hover { background: #f5f7ff; }
        .as-page .as-option-icon {
          display: flex; width: 30px; height: 30px; flex: 0 0 auto;
          align-items: center; justify-content: center; border-radius: 9px;
          color: #64748b; background: #f1f5f9;
        }
        .as-page .as-option-text { min-width: 0; flex: 1; }
        .as-page .as-option-title { display: block; color: #273449; font-size: 12px; font-weight: 750; }
        .as-page .as-option-sub { display: block; margin-top: 4px; color: #8995a7; font-size: 10px; line-height: 1.5; }
        .as-page .as-menu-message { padding: 14px 12px; color: #7b8798; font-size: 12px; line-height: 1.6; }
        .as-page .as-note {
          display: flex; gap: 11px; align-items: flex-start; padding: 14px 15px;
          border: 1px solid #e0e7ff; border-radius: 14px;
          background: #f7f8ff; color: #64748b; font-size: 11px; line-height: 1.65;
        }
        .as-page .as-price-preview {
          display: flex; align-items: center; justify-content: space-between; gap: 15px;
          border: 1px solid #e3e8f3; border-radius: 15px; padding: 15px 17px;
          background: linear-gradient(120deg,#fbfcff,#f8faff);
        }
        .as-page .as-profit {
          color: #047857; background: #ecfdf5; border: 1px solid #d1fae5;
          border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 800;
          white-space: nowrap;
        }
        .as-page .as-purchase-banner {
          display: flex; align-items: flex-start; gap: 11px;
          padding: 13px 14px; border: 1px solid #c7d2fe; border-radius: 13px;
          background: #f5f7ff; color: #596681; font-size: 11px; line-height: 1.6;
        }
        .as-page .as-footer {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
          gap: 15px; border-top: 1px solid #edf0f5; padding: 19px 25px;
          background: #fbfcfe; border-radius: 0 0 22px 22px;
        }
        .as-page .as-spin { animation: as-spin 1s linear infinite; }
        @keyframes as-spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .as-page .as-panel { border-radius: 17px; }
          .as-page .as-panel-head { padding: 17px; border-radius: 17px 17px 0 0; }
          .as-page .as-form-body { padding: 18px; }
          .as-page .as-footer { padding: 16px 18px; border-radius: 0 0 17px 17px; }
          .as-page .as-footer > * { width: 100%; }
          .as-page .as-footer .as-primary,
          .as-page .as-footer .as-secondary { width: 100%; }
          .as-page .as-price-preview { align-items: flex-start; flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          .as-page *, .as-page *::before, .as-page *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="mb-6">
        <Link to="/dashboard/stock" className="as-back mb-5">
          <ArrowLeft size={16} />
          {t("addStock.back")}
        </Link>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="as-eyebrow mb-2">
              <Sparkles size={13} />
              {t("addStock.eyebrow")}
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#182338] sm:text-3xl">
              {t("addStock.title")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718096]">
              {t("addStock.description")}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-[#e5eaf2] bg-white px-3.5 py-2.5 sm:self-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Package size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8995a7]">
                {t("addStock.newInventory")}
              </p>
              <p className="mt-0.5 text-xs font-bold text-[#263449]">
                {t("addStock.productSetup")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="as-panel">
        <div className="as-panel-head">
          <div className="as-icon-box">
            <Boxes size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold text-[#1e293b] sm:text-base">
              {t("addStock.productInformation")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#7b8798]">
              {t("addStock.productInformationDescription")}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-[10px] font-bold text-[#64748b] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("addStock.draft")}
          </span>
        </div>

        <div className="as-form-body space-y-7 p-6 sm:p-7">
          <section className="as-section">
            <h3 className="as-section-title">
              <span className="as-section-number">01</span>
              {t("addStock.basicDetails")}
            </h3>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <div ref={productRef} className="relative">
                <label htmlFor="productName" className="as-field-label">
                  {t("addStock.productName")}{" "}
                  <span className="as-required">*</span>
                </label>

                <div className="as-input-wrap">
                  <Search className="as-input-icon" size={17} />
                  <input
                    id="productName"
                    type="text"
                    value={productSearch}
                    onChange={handleProductSearch}
                    onFocus={() => setProductSearchOpen(true)}
                    placeholder={t("addStock.searchPurchaseOrEnterName")}
                    autoComplete="off"
                    required
                    className="as-input as-with-icon"
                    aria-expanded={productSearchOpen}
                    aria-controls="purchase-item-options"
                  />
                </div>

                <AnimatePresence>
                  {productSearchOpen && productSearch.trim() && (
                    <motion.div
                      id="purchase-item-options"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="as-dropdown"
                    >
                      {isLoadingPurchases ? (
                        <div className="as-menu-message flex items-center gap-2">
                          <LoaderCircle size={15} className="as-spin" />
                          {t("addStock.loadingPurchaseItems")}
                        </div>
                      ) : filteredPurchaseItems.length > 0 ? (
                        filteredPurchaseItems.map((item) => {
                          const remaining =
                            Number(item.quantity || 0) -
                            Number(item.quantity_added_to_stock || 0);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectPurchaseItem(item)}
                              className="as-option"
                            >
                              <span className="as-option-icon">
                                <ShoppingBag size={15} />
                              </span>
                              <span className="as-option-text">
                                <span className="as-option-title">
                                  {item.product_name}
                                </span>
                                <span className="as-option-sub">
                                  {t("addStock.purchase")}:{" "}
                                  {item.purchase_number || "—"} · {remaining}{" "}
                                  {t("addStock.unitsRemaining")}
                                </span>
                                <span className="as-option-sub">
                                  {t("addStock.unitPrice")}:{" "}
                                  {money(item.unit_price)}
                                </span>
                              </span>
                              <span className="mt-1 text-indigo-600">
                                <Plus size={15} />
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="as-menu-message">
                          {t("addStock.noPurchaseItems")}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="as-field-help">
                  {t("addStock.productSearchHelp")}
                </p>
              </div>

              <FormField
                label={t("addStock.sku")}
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. SKU-1001"
                icon={Hash}
                optionalLabel={t("addStock.optional")}
              />

              <div ref={categoryRef} className="relative">
                <label htmlFor="category" className="as-field-label">
                  {t("addStock.category")}{" "}
                  <span className="as-required">*</span>
                </label>

                <div className="as-input-wrap">
                  <Tag className="as-input-icon" size={17} />
                  <input
                    id="category"
                    type="text"
                    value={categorySearch}
                    onChange={handleCategoryInput}
                    onFocus={() => setCategoryOpen(true)}
                    placeholder={t("addStock.searchOrCreateCategory")}
                    autoComplete="off"
                    required
                    className="as-input as-with-icon pr-10"
                    aria-expanded={categoryOpen}
                  />
                  <ChevronDown
                    size={16}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
                      categoryOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="as-dropdown"
                    >
                      {isLoadingOptions ? (
                        <div className="as-menu-message flex items-center gap-2">
                          <LoaderCircle size={15} className="as-spin" />
                          {t("addStock.loadingCategories")}
                        </div>
                      ) : (
                        <>
                          {filteredCategories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => handleSelectCategory(category)}
                              className="as-option"
                            >
                              <span className="as-option-icon">
                                <Layers3 size={15} />
                              </span>
                              <span className="as-option-text">
                                <span className="as-option-title">
                                  {category.name}
                                </span>
                                <span className="as-option-sub">
                                  {t("addStock.productCategory")}
                                </span>
                              </span>
                              {selectedCategory?.id === category.id && (
                                <Check
                                  size={16}
                                  className="mt-1 text-indigo-600"
                                />
                              )}
                            </button>
                          ))}

                          {categorySearch.trim() && !exactCategoryExists && (
                            <button
                              type="button"
                              disabled={isCreatingCategory}
                              onClick={handleCreateCategory}
                              className="as-option mt-1 border-t border-slate-100 pt-3 disabled:opacity-60"
                            >
                              <span className="as-option-icon bg-indigo-50 text-indigo-600">
                                {isCreatingCategory ? (
                                  <LoaderCircle size={15} className="as-spin" />
                                ) : (
                                  <Plus size={16} />
                                )}
                              </span>
                              <span className="as-option-text">
                                <span className="as-option-title text-indigo-700">
                                  {isCreatingCategory
                                    ? t("addStock.creatingCategory")
                                    : t("addStock.createCategory").replace(
                                        "{name}",
                                        categorySearch.trim(),
                                      )}
                                </span>
                                <span className="as-option-sub">
                                  {t("addStock.addCategoryToStore")}
                                </span>
                              </span>
                            </button>
                          )}

                          {filteredCategories.length === 0 &&
                            !categorySearch.trim() && (
                              <div className="as-menu-message">
                                {t("addStock.noCategories")}
                              </div>
                            )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="as-field-help">{t("addStock.categoryHelp")}</p>
              </div>

              <div ref={supplierRef} className="relative">
                <label htmlFor="supplier" className="as-field-label">
                  {t("addStock.supplier")}{" "}
                  <span className="as-optional">{t("addStock.optional")}</span>
                </label>

                <div className="as-input-wrap">
                  <Truck className="as-input-icon" size={17} />
                  <input
                    id="supplier"
                    type="text"
                    value={supplierSearch}
                    onChange={(event) => {
                      setSupplierSearch(event.target.value);
                      setSelectedSupplier(null);
                      setSupplierOpen(true);
                    }}
                    onFocus={() => setSupplierOpen(true)}
                    placeholder={t("addStock.searchSuppliers")}
                    autoComplete="off"
                    className="as-input as-with-icon pr-10"
                    aria-expanded={supplierOpen}
                  />
                  <ChevronDown
                    size={16}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
                      supplierOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {supplierOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="as-dropdown"
                    >
                      {isLoadingOptions ? (
                        <div className="as-menu-message flex items-center gap-2">
                          <LoaderCircle size={15} className="as-spin" />
                          {t("addStock.loadingSuppliers")}
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplier(null);
                              setSupplierSearch("");
                              setSupplierOpen(false);
                            }}
                            className="as-option"
                          >
                            <span className="as-option-icon">
                              <X size={15} />
                            </span>
                            <span className="as-option-text">
                              <span className="as-option-title">
                                {t("addStock.noSupplier")}
                              </span>
                              <span className="as-option-sub">
                                {t("addStock.withoutSupplier")}
                              </span>
                            </span>
                          </button>

                          {filteredSuppliers.map((supplier) => (
                            <button
                              key={supplier.id}
                              type="button"
                              onClick={() => handleSelectSupplier(supplier)}
                              className="as-option"
                            >
                              <span className="as-option-icon">
                                <Truck size={15} />
                              </span>
                              <span className="as-option-text">
                                <span className="as-option-title">
                                  {supplier.name}
                                </span>
                                {supplier.company_name && (
                                  <span className="as-option-sub">
                                    {supplier.company_name}
                                  </span>
                                )}
                              </span>
                              {selectedSupplier?.id === supplier.id && (
                                <Check
                                  size={16}
                                  className="mt-1 text-indigo-600"
                                />
                              )}
                            </button>
                          ))}

                          {filteredSuppliers.length === 0 &&
                            supplierSearch.trim() && (
                              <div className="as-menu-message">
                                {t("addStock.noMatchingSupplier")}
                              </div>
                            )}

                          {suppliers.length === 0 && !supplierSearch.trim() && (
                            <div className="as-menu-message">
                              {t("addStock.noSuppliers")}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="as-field-help">{t("addStock.supplierHelp")}</p>
              </div>

              <div className="md:col-span-2">
                <FormField
                  label={t("addStock.descriptionLabel")}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t("addStock.descriptionPlaceholder")}
                  multiline
                  icon={FileText}
                  optionalLabel={t("addStock.optional")}
                />
              </div>
            </div>
          </section>

          <section className="as-section">
            <h3 className="as-section-title">
              <span className="as-section-number">02</span>
              {t("addStock.stockDetails")}
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label={t("addStock.quantity")}
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 20"
                required
                icon={Boxes}
                optionalLabel={t("addStock.optional")}
              />

              <FormField
                label={t("addStock.minimumStockAlert")}
                name="minStock"
                type="number"
                min="0"
                step="1"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="e.g. 5"
                required
                icon={CircleAlert}
                optionalLabel={t("addStock.optional")}
              />
            </div>

            <div className="as-note mt-5">
              <Info size={16} className="mt-0.5 shrink-0 text-indigo-500" />
              <p>
                <strong className="text-[#46536b]">
                  {t("addStock.stockAlertTip")}
                </strong>{" "}
                {t("addStock.stockAlertDescription")}
              </p>
            </div>
          </section>

          <section className="as-section">
            <h3 className="as-section-title">
              <span className="as-section-number">03</span>
              {t("addStock.pricing")}
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label={t("addStock.purchasePrice")}
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="e.g. 500"
                required
                icon={DollarSign}
                disabled={Boolean(selectedPurchaseItem)}
                optionalLabel={t("addStock.optional")}
              />

              <FormField
                label={t("addStock.sellingPrice")}
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="e.g. 650"
                required
                icon={DollarSign}
                optionalLabel={t("addStock.optional")}
              />
            </div>

            {selectedPurchaseItem && (
              <div className="as-purchase-banner mt-5">
                <ShoppingBag
                  size={16}
                  className="mt-0.5 shrink-0 text-indigo-600"
                />
                <div>
                  <p className="font-extrabold text-[#384765]">
                    {t("addStock.purchaseItemSelected")}
                  </p>
                  <p className="mt-1">
                    {t("addStock.purchaseItemDescription")}
                  </p>
                </div>
              </div>
            )}

            {estimatedProfit !== null && (
              <div className="as-price-preview mt-5">
                <div>
                  <p className="text-xs font-bold text-[#7b8798]">
                    {t("addStock.estimatedProfit")}
                  </p>
                  <p
                    className={`mt-1 text-xl font-extrabold ${
                      estimatedProfit >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {estimatedProfit < 0 ? "−" : ""}
                    {money(Math.abs(estimatedProfit))}
                  </p>
                  <p className="mt-1 text-[10px] text-[#8995a7]">
                    {t("addStock.sellingMinusPurchase")}
                  </p>
                </div>

                {estimatedMargin !== null && (
                  <div className="as-profit">
                    {estimatedMargin.toFixed(1)}% {t("addStock.margin")}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="as-footer">
          <p className="flex items-center gap-2 text-[11px] text-[#8995a7]">
            <Info size={14} />
            {t("addStock.requiredFields")}{" "}
            <span className="as-required">*</span> {t("addStock.areRequired")}
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link to="/dashboard/stock" className="as-secondary">
              <X size={16} />
              {t("addStock.cancel")}
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingOptions || isCreatingCategory}
              className="as-primary"
            >
              {isSubmitting ? (
                <LoaderCircle size={17} className="as-spin" />
              ) : (
                <Save size={17} />
              )}
              {isSubmitting
                ? t("addStock.addingStock")
                : t("addStock.saveProduct")}
            </button>
          </div>
        </div>
      </form>

      <p className="mt-4 flex items-center justify-center gap-2 pb-2 text-center text-[10px] text-[#9aa5b5]">
        <Package size={13} />
        {t("addStock.footer")}
      </p>
    </motion.div>
  );
};

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
  multiline = false,
  disabled = false,
  optionalLabel = "Optional",
}) => {
  return (
    <div>
      <label htmlFor={name} className="as-field-label">
        <span>{label}</span>
        {required ? (
          <span className="as-required" aria-label="Required">
            *
          </span>
        ) : (
          <span className="as-optional">{optionalLabel}</span>
        )}
      </label>

      <div className="as-input-wrap">
        {Icon && <Icon size={17} className="as-input-icon" />}

        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`as-input ${Icon ? "as-with-icon" : ""}`}
            rows={4}
            disabled={disabled}
          />
        ) : (
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
            disabled={disabled}
            className={`as-input ${Icon ? "as-with-icon" : ""} ${
              disabled ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default AddStock;
