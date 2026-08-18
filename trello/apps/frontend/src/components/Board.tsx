import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

type User = {
  id: number;
};

type WSMessage =
  | {
      type: "initial_state";
      users: User[];
    }
  | {
      type: "join" | "leave";
      userId: number;
    };

function Board() {
  const { boardId } = useParams<{ boardId: string }>();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!boardId) return;

    const ws = new WebSocket("ws://localhost:8080");

    
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          boardId,
        })
      );
    };

    
    ws.onmessage = (ev) => {
      const data: WSMessage = JSON.parse(ev.data);

      if (data.type === "initial_state") {
        setUsers(data.users);
      }

      if (data.type === "join") {
        setUsers((users) => [
          ...users,
          {
            id: data.userId,
          },
        ]);
      }

      if (data.type === "leave") {
        setUsers((users) =>
          users.filter((user) => user.id !== data.userId)
        );
      }
    };

    // Handle errors
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    
    return () => {
      ws.close();
    };
  }, [boardId]);

  return (
    <div className="flex flex-col">
      <div>You are on board {boardId}</div>

      <div>
        Currently active users: {JSON.stringify(users)}
      </div>
    </div>
  );
}

export default Board;