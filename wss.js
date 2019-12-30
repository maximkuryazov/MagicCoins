const WebSocket = require("ws");

const { Session } = require("./model");

const wss = new WebSocket.Server({
  port: 8080
});

const clients = {};

wss.on("connection", function connection(ws) {
  console.log("WS connection");

  ws.on("message", function incoming(messageStr) {
    console.log("Received through WS: %s", messageStr);
    const message = JSON.parse(messageStr);

    Session.findOne({
      where: {
        user: message.user,
        token: message.token
      }
    }).then(s => {
      if (s) {
        if (clients[message.user] && clients[message.user] !== ws) {
          console.log("Un-binding an existing WS...");

          clients[message.user].send(
            JSON.stringify({
              name: "error",
              description: "The web-socket is now bound to another session."
            })
          );

          clients[message.user].close();
          clients[message.user] = null;
        }
        if (!clients[message.user]) {
          clients[message.user] = ws;
          console.log("Registered web-socket for user:", message.user);
          ws.send(
            JSON.stringify({
              name: "message",
              description:
                "Your web-socket is now bound to your active session."
            })
          );
        }
      } else {
        console.log(
          "No session was found for socket connection:",
          message.token
        );
      }
    });
  });

  ws.send(
    JSON.stringify({
      name: "message",
      description:
        "Your web-socket is now connected. Bind it to your current session, please."
    })
  );
});

wss.emitChangeEvent = (user, owner, name, delta) => {
  if (user instanceof Array) {
    user.forEach(u => {
      wss.emitChangeEvent(u, owner, name, delta);
    });
  } else {
    console.log("Emitting item change event: ", user, owner, name, delta);
    // console.log("Available clients: ", clients);
    const ws = clients[user];
    if (ws) {
      const json = {
        owner,
        name,
        delta
      };
      console.log("Emitting an item change event:", json);
      ws.send(JSON.stringify(json));
    }
  }
};

module.exports = wss;
