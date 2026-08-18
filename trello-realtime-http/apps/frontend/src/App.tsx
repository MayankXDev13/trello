import { useEffect, useState } from "react";
import "./index.css";

interface Issue {
  id: number;
  title: string;
  section: "todo" | "in-progress" | "done";
}

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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "initial_state") {
        setIssues(data.issues);
      }

      if (data.type === "issue_created") {
        setIssues((prev) => [...prev, data.issue]);
      }

      if (data.type === "issue_deleted") {
        setIssues((prev) =>
          prev.filter((issue) => issue.id !== data.issueId)
        );
      }

      if (data.type === "issue_updated") {
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === data.issueId
              ? {
                ...issue,
                title: data.title,
              }
              : issue
          )
        );
      }

      if (data.type === "issue_moved") {
        setIssues((prev) =>
          prev.map((issue) =>
            issue.id === data.issueId
              ? {
                ...issue,
                section: data.section,
              }
              : issue
          )
        );
      }
    };

    socket.onclose = () => {
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  const createTodo = () => {
    if (!title.trim()) return;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "issue_added", // this is event that back end  handle
        title: title.trim(),
        section: "todo",
      })
    );

    setTitle("");
  };

  const deleteTodo = (issueId: number) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "issue_deleted",
        issueId,
      })
    );
  };

  const updateTodo = (issueId: number) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!editTitle.trim()) return;

    ws.send(
      JSON.stringify({
        type: "issue_updated",
        issueId,
        title: editTitle.trim(),
      })
    );

    setEditId(null);
    setEditTitle("");
  };

  const moveTodo = (
    issueId: number,
    section: Issue["section"]
  ) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "issue_moved",
        issueId,
        section,
      })
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-rose-500/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold">
              Task<span className="text-rose-500">Flow</span>
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Manage your tasks
            </p>
          </div>

          <div className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
            {issues.length} Tasks
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createTodo();
              }
            }}
            placeholder="Add a new task..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-rose-500"
          />

          <button
            type="button"
            onClick={createTodo}
            disabled={!title.trim() || !ws}
            className="rounded-xl bg-rose-500 px-6 py-3 font-semibold text-black disabled:opacity-40"
          >
            + Add Task
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {columns.map((column) => {
            const columnIssues = issues.filter(
              (issue) => issue.section === column.id
            );

            return (
              <div
                key={column.id}
                className="min-h-125 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-semibold">
                    {column.title}
                  </h2>

                  <span className="rounded-lg bg-rose-500/10 px-3 py-1 text-xs text-rose-400">
                    {columnIssues.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-xl border border-zinc-800 bg-black p-4"
                    >
                      {editId === issue.id ? (
                        <input
                          value={editTitle}
                          onChange={(e) =>
                            setEditTitle(e.target.value)
                          }
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-rose-500"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-zinc-200">
                          {issue.title}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        {column.id !== "todo" && (
                          <button
                            onClick={() =>
                              moveTodo(
                                issue.id,
                                column.id === "done"
                                  ? "in-progress"
                                  : "todo"
                              )
                            }
                            className="rounded-lg border border-zinc-800 px-3 py-1 text-xs hover:border-rose-500"
                          >
                            ←
                          </button>
                        )}

                        {column.id !== "done" && (
                          <button
                            onClick={() =>
                              moveTodo(
                                issue.id,
                                column.id === "todo"
                                  ? "in-progress"
                                  : "done"
                              )
                            }
                            className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-black"
                          >
                            →
                          </button>
                        )}

                        {editId === issue.id ? (
                          <button
                            onClick={() =>
                              updateTodo(issue.id)
                            }
                            className="rounded-lg bg-green-500 px-3 py-1 text-xs font-semibold text-black"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(issue.id);
                              setEditTitle(issue.title);
                            }}
                            className="rounded-lg border border-zinc-800 px-3 py-1 text-xs hover:border-rose-500"
                          >
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteTodo(issue.id)
                          }
                          className="rounded-lg border border-zinc-800 px-3 py-1 text-xs text-red-400 hover:border-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {columnIssues.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-xs text-zinc-700">
                      No tasks
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