import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Truck,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const emptyForm = {
  name: "",
  company_name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const Suppliers = () => {
  const { t } = useLanguage();

  const tr = (key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            tr("suppliers.loadError", "Could not load suppliers."),
        );
      }

      setSuppliers(data.suppliers || []);
    } catch (error) {
      toast.error(
        error.message || tr("suppliers.loadError", "Could not load suppliers."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);

    setForm({
      name: supplier.name || "",
      company_name: supplier.company_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingSupplier(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(tr("suppliers.nameRequired", "Supplier name is required."));
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingSupplier);

      const response = await fetch(
        isEditing
          ? `${API_URL}/suppliers/${editingSupplier.id}`
          : `${API_URL}/suppliers`,
        {
          method: isEditing ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            company_name: form.company_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            notes: form.notes.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || tr("suppliers.saveError", "Could not save supplier."),
        );
      }

      toast.success(
        data.message ||
          (isEditing
            ? tr("suppliers.updated", "Supplier updated successfully.")
            : tr("suppliers.added", "Supplier added successfully.")),
      );

      setModalOpen(false);
      setEditingSupplier(null);
      setForm({ ...emptyForm });

      await fetchSuppliers();
    } catch (error) {
      toast.error(
        error.message || tr("suppliers.saveError", "Could not save supplier."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const confirmationMessage = tr(
      "suppliers.confirmDelete",
      'Are you sure you want to delete "{{name}}"?',
    ).replace("{{name}}", supplier.name);

    const confirmed = window.confirm(confirmationMessage);

    if (!confirmed) return;

    setDeletingId(supplier.id);

    try {
      const response = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            tr("suppliers.deleteError", "Could not delete supplier."),
        );
      }

      toast.success(
        data.message ||
          tr("suppliers.deleted", "Supplier deleted successfully."),
      );

      setSuppliers((previous) =>
        previous.filter((item) => item.id !== supplier.id),
      );
    } catch (error) {
      toast.error(
        error.message ||
          tr("suppliers.deleteError", "Could not delete supplier."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      supplier.name,
      supplier.company_name,
      supplier.phone,
      supplier.email,
      supplier.address,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <Truck size={20} />
              <span className="text-sm font-semibold">
                {tr("suppliers.eyebrow", "Inventory Management")}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {tr("suppliers.title", "Suppliers")}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {tr(
                "suppliers.subtitle",
                "Manage the people and companies supplying your products.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            {tr("suppliers.addSupplier", "Add Supplier")}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tr("suppliers.totalSuppliers", "Total Suppliers")}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {suppliers.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Truck size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {tr("suppliers.searchResults", "Search Results")}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {filteredSuppliers.length}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Search size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={tr(
                  "suppliers.searchPlaceholder",
                  "Search name, company, or phone...",
                )}
                className={`${inputClass} pl-10`}
              />
            </div>

            <button
              type="button"
              onClick={fetchSuppliers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {tr("suppliers.refresh", "Refresh")}
            </button>
          </div>
        </div>

        {/* Supplier List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {tr("suppliers.directory", "Supplier Directory")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tr(
                "suppliers.directoryDescription",
                "Your saved supplier information.",
              )}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <LoaderCircle size={30} className="animate-spin text-blue-600" />
              <p className="text-sm">
                {tr("suppliers.loading", "Loading suppliers...")}
              </p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
                <Truck size={30} />
              </div>

              <h3 className="font-semibold text-slate-900">
                {search
                  ? tr("suppliers.noResults", "No suppliers found")
                  : tr("suppliers.noSuppliers", "No suppliers yet")}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search
                  ? tr("suppliers.tryAnotherSearch", "Try another search term.")
                  : tr(
                      "suppliers.emptyDescription",
                      "Add your first supplier to start organizing your inventory.",
                    )}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  {tr("suppliers.addFirst", "Add First Supplier")}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-slate-900">
                          {supplier.name}
                        </h3>
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {supplier.company_name ||
                            tr("suppliers.independent", "Independent supplier")}
                        </p>
                      </div>
                    </div>

                    {supplier.phone && (
                      <p className="flex items-center gap-2 break-all text-sm text-slate-600">
                        <Phone size={15} className="shrink-0 text-slate-400" />
                        {supplier.phone}
                      </p>
                    )}

                    {supplier.email && (
                      <p className="flex items-center gap-2 break-all text-sm text-slate-600">
                        <Mail size={15} className="shrink-0 text-slate-400" />
                        {supplier.email}
                      </p>
                    )}

                    {supplier.address && (
                      <p className="flex items-start gap-2 text-sm text-slate-600">
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span className="break-words">{supplier.address}</span>
                      </p>
                    )}

                    <div className="flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(supplier)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        {tr("suppliers.edit", "Edit")}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(supplier)}
                        disabled={deletingId === supplier.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === supplier.id ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        {tr("suppliers.delete", "Delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">
                        {tr("suppliers.supplier", "Supplier")}
                      </th>
                      <th className="px-5 py-4">
                        {tr("suppliers.contact", "Contact")}
                      </th>
                      <th className="px-5 py-4">
                        {tr("suppliers.address", "Address")}
                      </th>
                      <th className="px-5 py-4 text-right">
                        {tr("suppliers.actions", "Actions")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredSuppliers.map((supplier) => (
                      <tr
                        key={supplier.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <Building2 size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {supplier.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {supplier.company_name ||
                                  tr(
                                    "suppliers.independent",
                                    "Independent supplier",
                                  )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            {supplier.phone && (
                              <p className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone
                                  size={14}
                                  className="shrink-0 text-slate-400"
                                />
                                {supplier.phone}
                              </p>
                            )}

                            {supplier.email && (
                              <p className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail
                                  size={14}
                                  className="shrink-0 text-slate-400"
                                />
                                <span className="break-all">
                                  {supplier.email}
                                </span>
                              </p>
                            )}

                            {!supplier.phone && !supplier.email && (
                              <span className="text-sm text-slate-400">
                                {tr(
                                  "suppliers.noContact",
                                  "No contact details",
                                )}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="flex items-start gap-2 text-sm text-slate-600">
                            {supplier.address && (
                              <MapPin
                                size={15}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />
                            )}
                            <span className="break-words">
                              {supplier.address || "—"}
                            </span>
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(supplier)}
                              title={tr(
                                "suppliers.editSupplier",
                                "Edit supplier",
                              )}
                              className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(supplier)}
                              disabled={deletingId === supplier.id}
                              title={tr("suppliers.delete", "Delete supplier")}
                              className="rounded-lg border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId === supplier.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingSupplier
                    ? tr("suppliers.editSupplier", "Edit Supplier")
                    : tr("suppliers.addNewSupplier", "Add New Supplier")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingSupplier
                    ? tr(
                        "suppliers.updateDescription",
                        "Update the supplier's information.",
                      )
                    : tr(
                        "suppliers.createDescription",
                        "Enter the details of your new supplier.",
                      )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label={tr("suppliers.closeModal", "Close modal")}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    {tr("suppliers.supplierName", "Supplier Name")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={tr(
                      "suppliers.namePlaceholder",
                      "Enter supplier name",
                    )}
                    required
                    maxLength={150}
                  />
                </div>

                <div>
                  <label htmlFor="company_name" className={labelClass}>
                    {tr("suppliers.companyName", "Company Name")}
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={tr(
                      "suppliers.companyPlaceholder",
                      "Enter company name",
                    )}
                    maxLength={150}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    {tr("suppliers.phone", "Phone Number")}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={tr(
                      "suppliers.phonePlaceholder",
                      "Enter phone number",
                    )}
                    maxLength={30}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    {tr("suppliers.email", "Email Address")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="supplier@example.com"
                    maxLength={150}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    {tr("suppliers.address", "Address")}
                  </label>
                  <input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={tr(
                      "suppliers.addressPlaceholder",
                      "Supplier's address",
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={labelClass}>
                    {tr("suppliers.notes", "Notes")}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    className={`${inputClass} min-h-24 resize-y`}
                    placeholder={tr(
                      "suppliers.notesPlaceholder",
                      "Additional information about this supplier",
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {tr("suppliers.cancel", "Cancel")}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  {saving
                    ? tr("suppliers.saving", "Saving...")
                    : editingSupplier
                      ? tr("suppliers.saveChanges", "Save Changes")
                      : tr("suppliers.addSupplier", "Add Supplier")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
