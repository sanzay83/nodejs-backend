const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/vio/posts", (req, res) => {
  const { username, title, datetime, message, reaction } = req.body;
  db.query(
    "INSERT INTO posts (username, title, datetime, message, reaction) VALUES (?, ?, ?, ?, ?)",
    [username, title, datetime, message, reaction],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      const newPost = {
        id: result.postId,
        username,
        title,
        datetime,
        message,
        reaction,
      };
      res.status(201).json(newPost);
    }
  );
});

router.get("/vio/posts/:id", (req, res) => {
  const postId = req.params.id;

  db.query("SELECT * FROM posts WHERE id = ?", [postId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ message: "Post not found" });

    res.json(results[0]);
  });
});

router.put("/vio/posts/:id", (req, res) => {
  const postId = req.params.id;
  const { title, message } = req.body;

  db.query(
    "UPDATE posts SET title = ?, content = ? WHERE id = ?",
    [title, message, postId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Post not found" });

      res.json({ message: "Post updated successfully" });
    }
  );
});

router.get("/vio/posts", (req, res) => {
  db.query("SELECT * FROM posts", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

router.delete("/vio/posts/:id", (req, res) => {
  const postId = req.params.id;

  db.query("DELETE FROM posts WHERE id = ?", [postId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Post not found" });
    res.status(204).send();
  });
});

module.exports = router;
