import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const connectDatabase = async () => {
  try {
    const url = process.env.DB_URL;

    await mongoose.connect(url);

    logger.info("Database connected successfully");
    console.log("MongoDB connected");
  } catch (error) {
    logger.error("Failed to connect to database", { error: error.message });
    console.error(" DB connection error:", error);
    process.exit(1);
  }
};
