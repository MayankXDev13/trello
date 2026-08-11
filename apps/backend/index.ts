import express, { type Application } from "express";
import { db } from "./db/db";
import { User } from "./db/schema";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


