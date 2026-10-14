import { Prisma } from "../../generated/prisma/client.ts";
import prisma from "../lib/prisma.js";

// Create a supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, company_name, phone, email, address, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const supplier = await prisma.suppliers.create({
      data: {
        store_id: store.id,
        name: name.trim(),
        company_name: company_name?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier.",
    });
  }
};

// Get all suppliers belonging to the authenticated user's store
export const getSuppliers = async (req, res) => {
  try {
    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const suppliers = await prisma.suppliers.findMany({
      where: { store_id: store.id },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load suppliers.",
    });
  }
};

// Update a supplier
export const updateSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);
    const { name, company_name, phone, email, address, notes } = req.body;

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID.",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier name cannot be empty.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        id: supplierId,
        store_id: store.id,
      },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    const supplier = await prisma.suppliers.update({
      where: { id: supplierId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(company_name !== undefined && {
          company_name: company_name?.trim() || null,
        }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && {
          email: email?.trim().toLowerCase() || null,
        }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully.",
      supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier.",
    });
  }
};

// Delete a supplier
export const deleteSupplier = async (req, res) => {
  try {
    const supplierId = Number(req.params.id);

    if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: supplierId,
        store_id: store.id,
      },
      select: { id: true },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    const linkedProducts = await prisma.products.count({
      where: {
        store_id: store.id,
        supplier_id: supplierId,
      },
    });

    if (linkedProducts > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This supplier is linked to products. Remove those links before deleting it.",
      });
    }

    await prisma.suppliers.delete({
      where: { id: supplierId },
    });

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully.",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier.",
    });
  }
};
