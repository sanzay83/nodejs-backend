const express = require("express");
const router = express.Router();
const promisePool = require("../db");

router.post("/vio/posts", async (req, res) => {
  const { username, title, datetime, message, reaction } = req.body;
  try {
    await promisePool.execute(
      "INSERT INTO posts (username, title, datetime, message, reaction) VALUES (?, ?, ?, ?, ?)",
      [username, title, datetime, message, reaction]
    );
    res.status(201).json({ message: "Post added Successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

router.get("/vio/posts", async (req, res) => {
  try {
    const [rows] = await promisePool.execute("SELECT * FROM posts");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

router.get("/vio/posts/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    const [rows] = await promisePool.execute(
      "SELECT * FROM posts WHERE postid = ?",
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

// router.put("/vio/posts/:id", (req, res) => {
//   const postId = req.params.id;
//   const { title, message } = req.body;

//   db.query(
//     "UPDATE posts SET title = ?, content = ? WHERE id = ?",
//     [title, message, postId],
//     (err, result) => {
//       if (err) return res.status(500).json({ message: "Database error" });
//       if (result.affectedRows === 0)
//         return res.status(404).json({ message: "Post not found" });

//       res.json({ message: "Post updated successfully" });
//     }
//   );
// });

// router.delete("/vio/posts/:id", (req, res) => {
//   const postId = req.params.id;

//   db.query("DELETE FROM posts WHERE id = ?", [postId], (err, result) => {
//     if (err) return res.status(500).json({ message: "Database error" });
//     if (result.affectedRows === 0)
//       return res.status(404).json({ message: "Post not found" });
//     res.status(204).send();
//   });
// });

router.post("/vio/posts/reaction", async (req, res) => {
  const { postid, username, reaction } = req.body;
  const newReaction = reaction + 1;

  try {
    const [rows] = await promisePool.execute(
      "SELECT * FROM reaction WHERE postid=? AND username=?",
      [postid, username]
    );

    if (rows.length > 0) {
      res.status(201).json({ message: "already liked" });
    } else {
      await promisePool.execute(
        "INSERT INTO reaction (username, postid) VALUES (?, ?)",
        [username, postid]
      );
      await promisePool.execute(
        "UPDATE posts SET reaction=? WHERE username=? AND postid=?",
        [newReaction, username, postid]
      );
      res.status(201).json({ message: "liked" });
    }
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
