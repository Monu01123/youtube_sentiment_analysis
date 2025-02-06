import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { getSentiment } from "./senti.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const commentSchema = new mongoose.Schema({
  videoId: String,
  comment: String,
  sentiment: String,
});

const Comment = mongoose.model("Comment", commentSchema);

app.get("/api/comments/:videoId", async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${process.env.YOUTUBE_API_KEY}&videoId=${videoId}&part=snippet&maxResults=50`;

    const response = await axios.get(apiUrl);
    if (!response.data.items) {
      return res
        .status(400)
        .json({ error: "No comments found or invalid video ID." });
    }

    const comments = response.data.items.map(
      (item) => item.snippet.topLevelComment.snippet.textDisplay
    );

    res.json({ videoId, comments });
  } catch (error) {
    console.error("Error fetching YouTube comments:", error);
    res.status(500).json({ error: "Failed to fetch YouTube comments." });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { comments, videoId } = req.body;
  const analyzedResults = [];

  try {
    if (!comments || comments.length === 0) {
      return res.status(400).json({ error: "No valid comments provided." });
    }

    for (let comment of comments) {
      const sentimentScore = getSentiment(comment);
      let sentiment;
      if (sentimentScore > 0) sentiment = "Positive";
      else if (sentimentScore < 0) sentiment = "Negative";
      else sentiment = "Neutral";

      analyzedResults.push({ comment, sentiment, sentimentScore });
    }

    res.json({ videoId, analyzedResults });
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    res.status(500).json({ error: "Sentiment analysis failed." });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
