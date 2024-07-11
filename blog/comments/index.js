const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];

  comments.push({ id: commentId, content, status: "pending" });

  commentsByPostId[req.params.id] = comments;

  await axios.post("http://localhost:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: "pending",
    },
  });

  res.status(201).send(comments);
});

app.delete("/posts/:id/comments/:commentId", async (req, res) => {
  const {id, commentId} = req.params;
  const comments = commentsByPostId[id];

  if (!comments) {
    return res.status(404).send({error: "Post or comment not found"});
  }

  const updatedComments = comments.filter(comment => comment.id !== commentId);
  commentsByPostId[id] = updatedComments;

  await axios.post("http://localhost:4005/events", {
    type: "CommentDeleted",
    data: {
      id,
      commentId,
    },
  });
  res.status(201).send();
});

// blog/comments/index.js
app.put("/posts/:id/comments/:commentId", async (req, res) => {
  const { id, commentId } = req.params;
  const { content } = req.body;

  const comments = commentsByPostId[id];
  if (!comments) {
    return res.status(404).send({ error: "Post not found" });
  }

  const comment = comments.find((comment) => comment.id === commentId);
  if (!comment) {
    return res.status(404).send({ error: "Comment not found" });
  }

  comment.content = content;

  await axios.post("http://localhost:4005/events", {
    type: "CommentUpdated",
    data: {
      id: commentId,
      content,
      postId: id,
      status: comment.status,
    },
  });

  res.status(200).send(comment);
});

app.post("/events", async (req, res) => {
  console.log("Event Received:", req.body.type);

  const { type, data } = req.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => {
      return comment.id === id;
    });
    comment.status = status;

    await axios.post("http://localhost:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on 4001");
});
