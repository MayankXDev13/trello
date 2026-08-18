import express, {
  type Application,
  type Request,
  type Response,
} from "express";

import cors from "cors";

const PORT = 3001;
const app: Application = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json());

interface Issue {
  id: number;
  title: string;
  section: "todo" | "in-progress" | "done";
}

const issues: Issue[] = [];

// CREATE ISSUE
app.post("/issues", (req: Request, res: Response) => {
  const { title, section } = req.body;

  if (!title || !section) {
    return res.status(400).json({
      error: "Title and section are required",
    });
  }

  const issue: Issue = {
    id: Date.now(),
    title,
    section,
  };

  issues.push(issue);

  return res.status(201).json(issue);
});

// GET ALL ISSUES
app.get("/issues", (_req: Request, res: Response) => {
  return res.status(200).json({
    issues,
  });
});

// MOVE ISSUE
app.post("/issues/move", (req: Request, res: Response) => {
  const { issueId, section } = req.body;

  const issue = issues.find((issue) => issue.id === Number(issueId));

  if (!issue) {
    return res.status(404).json({
      error: "Issue not found",
    });
  }

  if (!["todo", "in-progress", "done"].includes(section)) {
    return res.status(400).json({
      error: "Invalid section",
    });
  }

  issue.section = section;

  return res.status(200).json(issue);
});

// UPDATE ISSUE
app.patch("/issues/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, section } = req.body;

  const issue = issues.find(
    (issue) => issue.id === Number(id),
  );

  if (!issue) {
    return res.status(404).json({
      error: "Issue not found",
    });
  }

  if (title !== undefined) {
    issue.title = title;
  }

  if (section !== undefined) {
    if (!["todo", "in-progress", "done"].includes(section)) {
      return res.status(400).json({
        error: "Invalid section",
      });
    }

    issue.section = section;
  }

  return res.status(200).json(issue);
});

// DELETE ISSUE
app.delete("/issues/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const index = issues.findIndex(
    (issue) => issue.id === Number(id),
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Issue not found",
    });
  }

  const [deletedIssue] = issues.splice(index, 1);

  return res.status(200).json(deletedIssue);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});