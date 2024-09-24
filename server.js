const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
const promisePool = require("./db");

const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const allowedOrigins = [
  process.env.CLIENT_SERVER,
  process.env.CLIENT_SERVER2,
  process.env.LOCAL_SERVER,
  process.env.LOCAL_SERVER2,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.static("public"));

const server = http.createServer(app);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/test", (req, res) => {
  res.status(201).json({ message: "Application is Running." });
});

app.post("/vio/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await promisePool.execute(
      "SELECT * FROM users WHERE username=?",
      [username]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Username already exists." });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await promisePool.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword]
      );
      res.status(201).json({ message: "User registered successfully." });
    }
  } catch (err) {
    res.status(500).json({ message: "Database Error. Failed to register." });
  }
});

app.post("/vio/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await promisePool.execute(
      "SELECT * FROM users WHERE username=?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.use("/", postsRouter);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  io.emit("user count", io.engine.clientsCount);
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
    console.log(msg[username]);
  });

  socket.on("disconnect", () => {
    io.emit("user count", io.engine.clientsCount);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
