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
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(
  cors({
    origin: process.env.CLIENT_SERVER,
    methods: ["GET", "POST"],
  })
);

const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

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

const server = http.createServer(sslOptions, app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_SERVER,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  io.emit("user count", io.engine.clientsCount);
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    io.emit("user count", io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
