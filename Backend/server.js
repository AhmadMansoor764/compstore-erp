import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

dotenv.config();

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

app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
