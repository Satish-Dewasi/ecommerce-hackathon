import express from 'express'
import dotenv from 'dotenv'
import {connectDatabase} from './config/db.js'
import Product from "./models/productModel.js"

const app = express();
dotenv.config();

connectDatabase()

app.listen(3000, () => {
  console.log("Server running on port 3000")
})
