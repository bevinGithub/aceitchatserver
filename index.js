import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Health / info route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      name: "Chat Server",
      version: "1.0.1",
    },
  });
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("disconnect", () => {
    io.emit("user-changed", { user: socket.username, event: "left" });
  });

  socket.on("set-name", (name) => {
    socket.username = name;
    io.emit("user-changed", { user: name, event: "joined" });
  });

  socket.on("set-sender", (sender) => {
    socket.senderID = sender;
    io.emit("user-changed", { senderID: sender, event: "joined" });
  });

  socket.on("set-receiver", (receiver) => {
    socket.receiverID = receiver;
    io.emit("user-changed", { receiverID: receiver, event: "joined" });
    console.log("Receiver ID:", receiver);
  });

  socket.on("set-icon", (icon) => {
    socket.userIcon = icon;
    io.emit("user-changed", { userIcon: icon, event: "joined" });
    console.log("Icon:", icon);
  });

  socket.on("set-listing", (listingID) => {
    socket.listingID = listingID;
  });

  socket.on("user-typing", (data) => {
    socket.userTyping = data;
    io.emit("get-user-typing", { receiver: data });
  });

  socket.on("joinRoom", (room) => {
    console.log("Room joined:", room);
    socket.join(room);
    socket.room = room;
    io.in(room).emit("joinedRoom", `User has joined the room: ${room}`);
  });

  socket.on("sendMsgRoom", (message) => {
    console.log("Room message:", socket.room, message);
    socket.message = message;

    const msgRoom = {
      msg: message.roomMsg,
      user: socket.username,
      senderID: socket.senderID,
      receiverID: socket.receiverID,
      userIcon: socket.userIcon,
      created: new Date(),
    };

    io.in(socket.room).emit("msgSendRoom", msgRoom);
  });

  socket.on("send-message", (message) => {
    console.log("Message:", message);

    io.emit("message", {
      msg: message.chatMessage,
      user: socket.username,
      senderID: socket.senderID,
      receiverID: socket.receiverID,
      listingID: socket.listingID,
      userIcon: socket.userIcon,
      created: new Date(),
    });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server listening on port ${PORT}`);
});