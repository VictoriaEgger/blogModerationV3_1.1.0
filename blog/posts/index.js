const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");
const {response} = require("express");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/posts", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;

  posts[id] = {
    id,
    title,
  };

  await axios.post("http://localhost:4005/events", {
    type: "PostCreated",
    data: {
      id,
      title,
    },
  });

  res.status(201).send(posts[id]);
});

app.delete("/posts/:id", async (req, res)=>
{
const postId = req.params.id;
delete posts[postId]; //liste von posts und der bestimmte post der gelöscht werden soll

  await axios.post("http://localhost:4005/events", {
    type: "PostDelete",
    data: {
      id: postId,
    },

  });
  res.status(200).send(posts); //schickt neue upgedatete liste zurück
});


app.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!posts[id]) {
    return res.status(404).send({ error: "Post not found" });
  }

  posts[id].title = title;

  await axios.post("http://localhost:4005/events", {
    type: "PostUpdated",
    data: {
      id,
      title,
    },
  });

  res.status(200).send(posts[id]);
});



app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);

  res.send({});
});

app.listen(4000, () => {
  console.log("Listening on 4000");
});
