import express from 'express'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

import productRoutes from './routes/productRoutes.js'
import {connectDatabase} from './config/db.js'
import Product from "./models/productModel.js"

const app = express();
app.use(express.json()) 
dotenv.config();

connectDatabase()

app.use("/api/v1", productRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000")
})
