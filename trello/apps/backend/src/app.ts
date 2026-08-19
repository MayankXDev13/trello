import 'dotenv/config';
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import organizationsRouter from './routes/organizations';
import { orgBoardRouter, boardRouter } from './routes/boards';
import sectionsRouter from './routes/sections';
import issuesRouter from './routes/issues';
import commentsRouter from './routes/comments';

const app: Application = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/organizations', organizationsRouter);

// Boards: org-scoped create/list mounted under /api/organizations/:organizationId/boards
// We mount orgBoardRouter at that prefix via a small wrapper
app.use('/api/organizations/:organizationId/boards', orgBoardRouter);

app.use('/api/boards', boardRouter);
app.use('/api/sections', sectionsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/comments', commentsRouter);

// Legacy stub catch
app.post('/api/signup', (req, res) =>
  res.status(410).json({ message: 'Use POST /api/auth/register' })
);

// 404
app.use((req: Request, res: Response) =>
  res.status(404).json({ message: 'Not found' })
);

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

export default app;

// Only listen if not imported (e.g., tests import app)
if (import.meta.main) {
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () =>
    console.log(`Server is running on http://localhost:${PORT}`)
  );
}
