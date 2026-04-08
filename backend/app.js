import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import errorMiddlware from "./middlewares/errors.js";
import cors from "cors";
import redis from "./utils/cache.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { connectDatabase } from "./config/db.js";
import requestLogger from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";

dotenv.config({ path: "./.env" });
const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000"
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
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDatabase();
await redis.connect();

app.use(requestLogger);
app.use("/api/v1", generalLimiter);

app.use("/api/v1", productRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1/seller", sellerRoutes);
app.use("/api/v1/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
//  error middleware
app.use(errorMiddlware);

const server = app.listen(PORT, () => {
  logger.info("Server started on port 5000");
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
