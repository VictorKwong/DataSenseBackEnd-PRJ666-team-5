const stoppable = require("stoppable");
const app = require("./app");
const { wss } = require("./websocket");
const userService = require("./services/userService");
const { exit } = require("process");

const port = parseInt(process.env.PORT || "8080", 10);

let server;

userService
  .connect()
  .then(() => {
    server = stoppable(
      app.listen(port, () => {
        console.log(`Server started on port ${port}`);
      })
    );

    // Upgrade HTTP requests to WebSocket connections
    server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });
  })
  .catch((error) => {
    console.error(error);
    exit(1);
  });

// Graceful shutdown handling
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  console.log("Received shutdown signal, closing WebSocket and HTTP server...");
  // Close WebSocket connections
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.close();
    }
  });

  server.stop((err) => {
    if (err) {
      console.error("Error shutting down the server:", err);
      process.exit(1);
    } else {
      console.log("Server shutdown gracefully");
      process.exit(0);
    }
  });
}

// module.exports = server;
