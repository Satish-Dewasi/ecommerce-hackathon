import mongoose from 'mongoose'

export const connectDatabase = async () => {
    try {
        const url = process.env.DB_URL;

        await mongoose.connect(url);

        console.log("MongoDB connected");

    } catch (error) {
        console.error(" DB connection error:", error);
        process.exit(1);
    }
};

