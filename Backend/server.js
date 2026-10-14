import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/authRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import storeRoutes from "./src/routes/storeRoutes.js";
import supplierRoutes from "./src/routes/supplierRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import purchaseRoutes from "./src/routes/purchaseRoutes.js";
import expensesRoutes from "./src/routes/expensesRoutes.js";
import salesRoutes from "./src/routes/salesRoutes.js";
const app = express();

app.get("/", (req, res) => {
  res.status(200).json({
    message: "CompStore ERP API is running",
  });
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://omarzai-store.netlify.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/sales", salesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
