import prisma from "../lib/prisma.js";

// Get the logged-in member's store
const getUserStore = async (userId) => {
  return prisma.stores.findUnique({
    where: {
      owner_id: userId,
    },
    select: {
      id: true,
    },
  });
};

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const store = await getUserStore(req.user.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const categories = await prisma.categories.findMany({
      where: {
        store_id: store.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve categories.",
    });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot exceed 100 characters.",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text.",
      });
    }

    const cleanDescription = description?.trim() || null;

    const store = await getUserStore(req.user.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const existingCategory = await prisma.categories.findUnique({
      where: {
        store_id_name: {
          store_id: store.id,
          name: cleanName,
        },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "This category already exists in your store.",
      });
    }

    const category = await prisma.categories.create({
      data: {
        name: cleanName,
        description: cleanDescription,
        store_id: store.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    // PostgreSQL unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This category already exists in your store.",
      });
    }

    console.error("Create category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};
