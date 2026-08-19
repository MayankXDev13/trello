import { WebSocketServer, WebSocket } from 'ws';

const server = new WebSocketServer({ port: 8080 });

const BOARDS: Record<string, { userId: number; socket: WebSocket }[]> = {};

console.log('WebSocket server started on ws://localhost:8080');

server.on('connection', socket => {
  console.log('Client connected');

  socket.on('message', data => {
    console.log('Message received:', data.toString());

    const parsedData = JSON.parse(data.toString());

    if (parsedData.type === 'join') {
      const boardId = parsedData.boardId;

      console.log(`User wants to join board: ${boardId}`);

      // Create an empty user list for the board if it doesn't exist
      if (!BOARDS[boardId]) {
        BOARDS[boardId] = [];

        console.log(`Created new board: ${boardId}`);
      }

      const newUserId = Math.random();

      console.log(`New user ID: ${newUserId}`);

      // Notify existing users that a new user joined
      for (const user of BOARDS[boardId]) {
        console.log(
          `Notifying user ${user.userId} that user ${newUserId} joined`
        );

        user.socket.send(
          JSON.stringify({
            type: 'join',
            userId: newUserId,
          })
        );
      }

      // Add the new user to the board
      BOARDS[boardId].push({
        userId: newUserId,
        socket,
      });

      console.log(`User ${newUserId} joined board ${boardId}`);

      console.log(
        `Current users in ${boardId}:`,
        BOARDS[boardId].map(user => user.userId)
      );

      // Send existing users to the new user
      const existingUsers = BOARDS[boardId]
        .filter(user => user.userId !== newUserId)
        .map(user => user.userId);

      socket.send(
        JSON.stringify({
          type: 'initial_state',
          users: existingUsers,
        })
      );

      console.log(`Sent initial state to user ${newUserId}:`, existingUsers);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    // {user1: "harkirat", user2: "raman"}
    // if you want to iterate over Object keys, values, or entries, you can use the following methods:
    // Object.keys(users) => ["user1", "user2"]
    // Object.values(users) => ["harkirat", "raman"]
    // Object.entries(users) => [["user1", "harkirat"], ["user2", "raman"]]

    Object.entries(BOARDS).forEach(([boardId, users]) => {
      // Find the disconnected user
      const disconnectedUser = users.find(user => user.socket === socket);

      if (!disconnectedUser) {
        return;
      }

      console.log(`User ${disconnectedUser.userId} left board ${boardId}`);

      // Remove the disconnected user from the board
      BOARDS[boardId] = users.filter(user => user.socket !== socket);

      console.log(
        `Remaining users in ${boardId}:`,
        BOARDS[boardId].map(user => user.userId)
      );

      // Notify remaining users that the user left
      BOARDS[boardId].forEach(user => {
        console.log(
          `Notifying user ${user.userId} that user ${disconnectedUser.userId} left`
        );

        user.socket.send(
          JSON.stringify({
            type: 'leave',
            userId: disconnectedUser.userId,
          })
        );
      });

      // Delete the board if no users remain
      if (BOARDS[boardId].length === 0) {
        delete BOARDS[boardId];

        console.log(`Deleted empty board: ${boardId}`);
      }
    });
  });
});
