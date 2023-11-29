import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:8080");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "anonymous";
  console.log(socket);

  socket.on("close", () => {
    console.log("Disconnected from Browser");
  });
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);
    console.log(message.type, message.payload);
    switch (message.type) {
      case "new_message": {
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break;
      }
      case "nickname": {
        socket["nickname"] = message.payload;
        break;
      }
    }

    //socket.send(`${message}`);
  });

  //  socket.send("hello!!");
});
server.listen(3000, handleListen);
