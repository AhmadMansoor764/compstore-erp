import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Boxes, PackagePlus, Save, X } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = "http://localhost:3000/api";

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
            productData.message || "Failed to load this product.",
          );
        }

        if (!optionsResponse.ok) {
          throw new Error(
            optionsData.message || "Failed to load categories and suppliers.",
          );
        }

        const product = productData.product || productData;

        if (!product || product.id == null) {
          throw new Error("Product not found.");
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
          setLoadError(error.message || "Failed to load product.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
      toast.error("Please fill in all required fields.");
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
      toast.error("Quantity and minimum stock must be non-negative integers.");
      return;
    }

    if (
      !Number.isFinite(purchasePriceValue) ||
      !Number.isFinite(sellingPriceValue) ||
      purchasePriceValue < 0 ||
      sellingPriceValue < 0
    ) {
      toast.error("Prices must be valid non-negative numbers.");
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(purchasePrice) ||
      !/^\d+(\.\d{1,2})?$/.test(sellingPrice)
    ) {
      toast.error("Prices can have up to two decimal places.");
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
        throw new Error(data.message || "Failed to update product.");
      }

      toast.success(data.message || "Stock updated successfully.");
      navigate("/dashboard/stock");
    } catch (error) {
      toast.error(error.message || "Failed to update stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Loading product information...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Unable to Load Product
        </h1>

        <p className="mt-2 text-sm text-red-600">{loadError}</p>

        <button
          type="button"
          onClick={() => navigate("/dashboard/stock")}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Stock
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-5xl space-y-6"
    >
      <div>
        <Link
          to="/dashboard/stock"
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
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

            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Edit Stock
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          Update the information of this inventory product.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm"
      >
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
                Edit the product details and pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <h3 className="mb-4 text-base font-bold text-slate-900">
              Basic Details
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Dell Latitude 5420"
                required
              />

              <FormField
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Example: SKU-1001"
              />

              <div>
                <label
                  htmlFor="category_id"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category <span className="text-red-500">*</span>
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="h-12 w-full rounded-xl border border-[#c8cce0] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="supplier_id"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Supplier
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Optional
                  </span>
                </label>

                <select
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-[#c8cce0] bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">No supplier</option>

                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Additional product information..."
                  className="w-full rounded-xl border border-[#c8cce0] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

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

        <div className="flex flex-col-reverse gap-3 border-t border-[#e2e5f0] bg-[#f8f8ff] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
          <Link
            to="/dashboard/stock"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <X size={17} />
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {isSubmitting ? "Updating Stock..." : "Save Changes"}
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
}) => (
  <div>
    <label
      htmlFor={name}
      className="mb-2 block text-sm font-semibold text-slate-700"
    >
      <span>{label}</span>

      {required ? (
        <span className="ml-1 text-red-500" title="This field is required">
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
      className="h-12 w-full rounded-xl border border-[#c8cce0] bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </div>
);

export default EditStock;
