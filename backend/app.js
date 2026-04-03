import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import errorMiddlware from "./middlewares/errors.js";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { connectDatabase } from "./config/db.js";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  // deployed frontend
];

app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, {
        origin: true,
        credentials: true,
      });
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDatabase();

app.use("/api/v1", productRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
// using error middleware
app.use(errorMiddlware);

const server = app.listen(PORT, () => {
  console.log(
    `Server is running at PORT : ${process.env.PORT} in ${process.env.NODE_ENV} mode`,
  );
});

// Handling unhandled Promise rejections

process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err}`);
  console.log("Shutting down server due to Unhandled Promise Rejections");

  server.close(() => {
    process.exit(1);
  });
});
