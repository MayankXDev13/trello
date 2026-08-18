import { WebSocketServer } from "ws";

interface Issue {
  id: number;
  title: string;
  section: "todo" | "in-progress" | "done";
}

const issues: Issue[] = [];

const wss = new WebSocketServer({ port: 3001 }); // const app = express(), app.listen(3000)

wss.on("connection", (socket) => {
  console.log("client connected");

  socket.send(
    JSON.stringify({
      type: "initial_state",
      issues,
    }),
  );

  socket.on("message", (message) => {
    const data = JSON.parse(message.toString());

    console.log("received:", data);

    if (data.type === "issue_added") {
      // type event to send data to frontend
      const issue: Issue = {
        id: Date.now(),
        title: data.title,
        section: data.section,
      };

      issues.push(issue);

      broadcast({
        type: "issue_created", // type event of event to broadcast
        issue,
      });
    }

    if (data.type === "issue_deleted") {
      const index = issues.findIndex(
        (issue) => issue.id === data.issueId,
      );

      if (index !== -1) {
        issues.splice(index, 1);

        broadcast({
          type: "issue_deleted",
          issueId: data.issueId,
        });
      }
    }

    if (data.type === "issue_updated") {
      const issue = issues.find(
        (issue) => issue.id === data.issueId,
      );

      if (issue) {
        issue.title = data.title;

        broadcast({
          type: "issue_updated",
          issueId: data.issueId,
          title: data.title,
        });
      }
    }

    if (data.type === "issue_moved") {
      const issue = issues.find(
        (issue) => issue.id === data.issueId,
      );

      if (issue) {
        issue.section = data.section;

        broadcast({
          type: "issue_moved",
          issueId: data.issueId,
          section: data.section,
        });
      }
    }
  });

  socket.on("close", () => {
    console.log("client disconnected");
  });
});

function broadcast(data: object) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}