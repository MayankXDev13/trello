import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { db, users } from "@repo/db";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/api/signup", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    const user = await db
      .insert(users)
      .values({
        email: email,
        username: username,
        password: password,
      })
      .returning();

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
