import { useEffect, useState } from "react";
import axios from "axios";
import "./index.css";

interface Issue {
  id: number;
  title: string;
  section: "todo" | "in-progress" | "done";
}

const API_URL = "http://localhost:3001";

const columns = [
  {
    id: "todo",
    title: "Todo",
  },
  {
    id: "in-progress",
    title: "In Progress",
  },
  {
    id: "done",
    title: "Done",
  },
] as const;

function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    axios
      .get<{ issues: Issue[] }>(`${API_URL}/issues`)
      .then((response) => {
        setIssues(response.data.issues);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const createTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) return;

    try {
      const response = await axios.post<Issue>(`${API_URL}/issues`, {
        title: title.trim(),
        section: "todo",
      });

      setIssues((prev) => [...prev, response.data]);
      setTitle("");
    } catch (error) {
      console.error(error);
    }
  };

  const moveTodo = async (issueId: number, section: Issue["section"]) => {
    try {
      const response = await axios.post<Issue>(`${API_URL}/issues/move`, {
        issueId,
        section,
      });

      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? response.data : issue)),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTodo = async (issueId: number) => {
    try {
      await axios.delete(`${API_URL}/issues/${issueId}`);

      setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    issueId: number,
  ) => {
    e.dataTransfer.setData("issueId", String(issueId));
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    section: Issue["section"],
  ) => {
    e.preventDefault();

    const issueId = Number(e.dataTransfer.getData("issueId"));

    if (!issueId) return;

    const issue = issues.find((issue) => issue.id === issueId);

    if (!issue || issue.section === section) return;

    moveTodo(issueId, section);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-rose-500/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold">
              Task<span className="text-rose-500">Flow</span>
            </h1>

            <p className="mt-1 text-sm text-zinc-500">Manage your tasks</p>
          </div>

          <div className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
            {issues.length} Tasks
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Create */}
        <form onSubmit={createTodo} className="mb-8 flex gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-rose-500 px-6 py-3 font-semibold text-black hover:bg-rose-400 disabled:opacity-40"
            disabled={!title.trim()}
          >
            + Add Task
          </button>
        </form>

        {/* Board */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {columns.map((column) => {
            const columnIssues = issues.filter(
              (issue) => issue.section === column.id,
            );

            return (
              <div
                key={column.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column.id)}
                className="min-h-125 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                {/* Column */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />

                    <h2 className="font-semibold">{column.title}</h2>
                  </div>

                  <span className="rounded-lg bg-rose-500/10 px-3 py-1 text-xs text-rose-400">
                    {columnIssues.length}
                  </span>
                </div>

                {/* Issues */}
                <div className="space-y-3">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      className="cursor-grab rounded-xl border border-zinc-800 bg-black p-4 hover:border-rose-500/50"
                    >
                      <p className="text-sm text-zinc-200">{issue.title}</p>

                      <div className="mt-4 flex justify-end gap-2">
                        {column.id !== "todo" && (
                          <button
                            onClick={() =>
                              moveTodo(
                                issue.id,
                                column.id === "done" ? "in-progress" : "todo",
                              )
                            }
                            className="rounded-lg border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:border-rose-500 hover:text-rose-400"
                          >
                            ←
                          </button>
                        )}

                        {column.id !== "done" && (
                          <button
                            onClick={() =>
                              moveTodo(
                                issue.id,
                                column.id === "todo" ? "in-progress" : "done",
                              )
                            }
                            className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-black hover:bg-rose-400"
                          >
                            →
                          </button>
                        )}

                        <button
                          onClick={() => deleteTodo(issue.id)}
                          className="rounded-lg border border-zinc-800 px-3 py-1 text-xs text-zinc-500 hover:border-rose-500 hover:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {columnIssues.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-xs text-zinc-700">
                      Drop task here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
