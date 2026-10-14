import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  PackagePlus,
  Save,
  X,
  Search,
  Plus,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = "http://localhost:3000/api";

const initialForm = {
  name: "",
  sku: "",
  quantity: "",
  minStock: "5",
  purchasePrice: "",
  sellingPrice: "",
  description: "",
};

const inputClass =
  "h-12 w-full rounded-xl border border-[#c8cce0] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const AddStock = () => {
  const navigate = useNavigate();
  const categoryRef = useRef(null);
  const supplierRef = useRef(null);

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

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const response = await fetch(`${API_URL}/products/form-options`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load form options.");
        }

        setCategories(data.categories || []);
        setSuppliers(data.suppliers || []);
      } catch (error) {
        toast.error(
          error.message || "Could not load categories and suppliers.",
        );
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadFormOptions();
  }, []);

  useEffect(() => {
    const loadPurchaseItems = async () => {
      try {
        const response = await fetch(`${API_URL}/purchases`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load purchase items.");
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
        toast.error(error.message || "Could not load purchase items.");
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    loadPurchaseItems();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }

      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setSupplierOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredPurchaseItems = purchaseItems.filter((item) => {
    const query = productSearch.trim().toLowerCase();

    const remainingQuantity =
      Number(item.quantity || 0) - Number(item.quantity_added_to_stock || 0);

    return (
      query &&
      remainingQuantity > 0 &&
      (item.product_name || "").toLowerCase().includes(query)
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

    toast.success("Purchase item selected. Review the remaining quantity.");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  const exactCategoryExists = categories.some(
    (category) =>
      category.name.trim().toLowerCase() ===
      categorySearch.trim().toLowerCase(),
  );

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = supplierSearch.trim().toLowerCase();

    return (
      supplier.name.toLowerCase().includes(query) ||
      (supplier.company_name || "").toLowerCase().includes(query)
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

    // Reuse a category if it already exists, ignoring letter case.
    const existingCategory = categories.find(
      (category) => category.name.trim().toLowerCase() === name.toLowerCase(),
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
        throw new Error(data.message || "Could not create category.");
      }

      if (!data.category) {
        throw new Error("The server did not return the saved category.");
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

      toast.success(data.message || "Category saved successfully.");
    } catch (error) {
      toast.error(error.message || "Could not create category.");
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
      toast.error("Please fill in all required fields and select a category.");
      return;
    }

    const numericValues = [
      Number(quantity),
      Number(minStock),
      Number(purchasePrice),
      Number(sellingPrice),
    ];

    if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error("Please enter valid non-negative numbers.");
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      !Number.isInteger(Number(minStock))
    ) {
      toast.error("Quantity and minimum stock must be whole numbers.");
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(purchasePrice) ||
      !/^\d+(\.\d{1,2})?$/.test(sellingPrice)
    ) {
      toast.error("Prices must have no more than two decimal places.");
      return;
    }

    if (selectedPurchaseItem) {
      const remaining =
        Number(selectedPurchaseItem.quantity || 0) -
        Number(selectedPurchaseItem.quantity_added_to_stock || 0);

      if (remaining <= 0) {
        toast.error("This purchase item has no remaining quantity.");
        return;
      }

      if (Number(quantity) !== remaining) {
        toast.error(
          `This purchase has ${remaining} unit(s) remaining. Please use that quantity.`,
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
        throw new Error(data.message || "Failed to save stock.");
      }

      toast.success(data.message || "Stock added successfully.");

      navigate("/dashboard/stock");
    } catch (error) {
      toast.error(error.message || "Failed to save stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-5xl space-y-6"
    >
      {/* Header */}
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
              <PackagePlus size={25} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Inventory Management
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Add New Stock
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Add a new product to your inventory by entering its details below.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm"
      >
        {/* Card Header */}
        <div className="border-b border-[#e2e5f0] bg-[#f8f8ff] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Boxes size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Product Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the basic information and pricing details.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6 p-5 sm:p-6">
          {/* Product Details */}
          <section>
            <h3 className="mb-4 text-base font-bold text-slate-900">
              Basic Details
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="relative">
                <label
                  htmlFor="productName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Product Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="productName"
                    type="text"
                    value={productSearch}
                    onChange={handleProductSearch}
                    onFocus={() => setProductSearchOpen(true)}
                    placeholder="Search purchase items or enter a new product"
                    autoComplete="off"
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>

                {productSearchOpen && productSearch.trim() && (
                  <div className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#c8cce0] bg-white py-2 shadow-lg">
                    {isLoadingPurchases ? (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        Loading purchase items...
                      </p>
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
                            className="w-full px-4 py-3 text-left transition hover:bg-blue-50"
                          >
                            <span className="block text-sm font-semibold text-slate-800">
                              {item.product_name}
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                              Purchase: {item.purchase_number} · Remaining:{" "}
                              {remaining}
                            </span>

                            <span className="mt-1 block text-xs text-slate-500">
                              Unit price: {item.unit_price}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        No purchase items with remaining quantity. You can enter
                        a new product manually.
                      </p>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Select an item from a purchase or enter a new product name.
                </p>
              </div>

              <FormField
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Example: SKU-1001"
              />

              {/* Searchable Category Input */}
              <div ref={categoryRef} className="relative">
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="category"
                    type="text"
                    value={categorySearch}
                    onChange={handleCategoryInput}
                    onFocus={() => setCategoryOpen(true)}
                    placeholder="Search or enter a category"
                    autoComplete="off"
                    required
                    className={`${inputClass} pl-10 pr-10`}
                  />

                  <ChevronDown
                    size={17}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {categoryOpen && (
                  <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#c8cce0] bg-white py-2 shadow-lg">
                    {isLoadingOptions ? (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        Loading categories...
                      </p>
                    ) : (
                      <>
                        {filteredCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSelectCategory(category)}
                            className={`flex w-full items-center px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${
                              selectedCategory?.id === category.id
                                ? "bg-blue-50 font-semibold text-blue-700"
                                : "text-slate-700"
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}

                        {categorySearch.trim() && !exactCategoryExists && (
                          <button
                            type="button"
                            disabled={isCreatingCategory}
                            onClick={handleCreateCategory}
                            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
                          >
                            <Plus size={17} />
                            {isCreatingCategory
                              ? "Adding category..."
                              : `Add "${categorySearch.trim()}"`}
                          </button>
                        )}

                        {filteredCategories.length === 0 &&
                          !categorySearch.trim() && (
                            <p className="px-4 py-3 text-sm text-slate-500">
                              No categories available yet.
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Select an existing category or add a new one here.
                </p>
              </div>

              {/* Searchable Supplier Dropdown */}
              <div ref={supplierRef} className="relative">
                <label
                  htmlFor="supplier"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Supplier
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

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
                    placeholder="Search existing suppliers"
                    autoComplete="off"
                    className={`${inputClass} pl-10 pr-10`}
                  />

                  <ChevronDown
                    size={17}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>

                {supplierOpen && (
                  <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-[#c8cce0] bg-white py-2 shadow-lg">
                    {isLoadingOptions ? (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        Loading suppliers...
                      </p>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplier(null);
                            setSupplierSearch("");
                            setSupplierOpen(false);
                          }}
                          className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-500 transition hover:bg-slate-50"
                        >
                          No supplier
                        </button>

                        {filteredSuppliers.map((supplier) => (
                          <button
                            key={supplier.id}
                            type="button"
                            onClick={() => handleSelectSupplier(supplier)}
                            className={`w-full px-4 py-3 text-left transition hover:bg-blue-50 ${
                              selectedSupplier?.id === supplier.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <span className="block text-sm font-medium text-slate-800">
                              {supplier.name}
                            </span>

                            {supplier.company_name && (
                              <span className="mt-1 block text-xs text-slate-500">
                                {supplier.company_name}
                              </span>
                            )}
                          </button>
                        ))}

                        {filteredSuppliers.length === 0 &&
                          supplierSearch.trim() && (
                            <p className="px-4 py-3 text-sm text-slate-500">
                              No matching supplier. Add suppliers through the
                              Suppliers page first.
                            </p>
                          )}

                        {suppliers.length === 0 && !supplierSearch.trim() && (
                          <p className="px-4 py-3 text-sm text-slate-500">
                            No suppliers yet. You can add one through the
                            Suppliers page.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Choose a supplier already registered in your store.
                </p>
              </div>

              <div className="md:col-span-2">
                <FormField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional product details"
                />
              </div>
            </div>
          </section>

          {/* Stock Details */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-base font-bold text-slate-900">
              Stock Details
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Example: 20"
                required
              />

              <FormField
                label="Minimum Stock Alert"
                name="minStock"
                type="number"
                min="0"
                step="1"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="Example: 5"
                required
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 text-base font-bold text-slate-900">Pricing</h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="Example: 500"
                required
              />

              <FormField
                label="Selling Price"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="Example: 650"
                required
              />
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#e2e5f0] bg-[#f8f8ff] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
          <Link
            to="/dashboard/stock"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <X size={17} />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions || isCreatingCategory}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {isSubmitting ? "Adding Stock..." : "Add Stock"}
          </button>
        </div>
      </form>
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
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        <span>{label}</span>

        {required ? (
          <span
            className="ml-1 text-red-500"
            title="This field is required"
            aria-label="Required"
          >
            *
          </span>
        ) : (
          <span className="ml-2 text-xs font-medium text-slate-400">
            Optional
          </span>
        )}
      </label>

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
        className={inputClass}
      />
    </div>
  );
};

export default AddStock;
