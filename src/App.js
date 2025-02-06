import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import React, { useState } from "react";
import { Pie } from "react-chartjs-2";
import "./App.css"

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [videoLink, setVideoLink] = useState(""); // Changed to videoLink to handle URL input
  const [videoId, setVideoId] = useState("");
  const [comments, setComments] = useState([]);
  const [sentiments, setSentiments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("default");

  // Extract YouTube Video ID from URL
  const extractVideoId = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    setSentiments([]);

    const extractedVideoId = extractVideoId(videoLink);
    if (extractedVideoId) {
      setVideoId(extractedVideoId); 

      try {
        const response = await axios.get(
          `http://localhost:5000/api/comments/${extractedVideoId}`
        );
        setComments(response.data.comments || []);
        if (!response.data.comments?.length) {
          setError("No comments found for this video.");
        }
      } catch (err) {
        setError("Failed to fetch comments. Please check the video ID.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Invalid YouTube URL.");
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await retryRequest("http://localhost:5000/api/analyze", {
        videoId,
        comments,
      });
      setSentiments(response.analyzedResults || []);
    } catch (err) {
      setError("Sentiment analysis failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const retryRequest = async (url, data, retries = 5, delay = 1000) => {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryRequest(url, data, retries - 1, delay * 2);
      } else {
        throw err;
      }
    }
  };


  const getSentimentCounts = () => {
    const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0 };

    sentiments.forEach((sentiment) => {
      if (sentiment.sentiment === "Positive") {
        sentimentCounts.Positive++;
      } else if (sentiment.sentiment === "Negative") {
        sentimentCounts.Negative++;
      } else {
        sentimentCounts.Neutral++;
      }
    });

    return sentimentCounts;
  };

  const sortedComments = () => {
    if (sortOption === "positive") {
      return sentiments.filter(
        (sentiment) => sentiment.sentiment === "Positive"
      );
    }
    if (sortOption === "negative") {
      return sentiments.filter(
        (sentiment) => sentiment.sentiment === "Negative"
      );
    }
    if (sortOption === "neutral") {
      return sentiments.filter(
        (sentiment) => sentiment.sentiment === "Neutral"
      );
    }
    return sentiments; 
  };

  const sentimentCounts = getSentimentCounts();
  const data = {
    labels: ["Positive", "Negative", "Neutral"],
    datasets: [
      {
        data: [
          sentimentCounts.Positive,
          sentimentCounts.Negative,
          sentimentCounts.Neutral,
        ],
        backgroundColor: ["#34D399", "#EF4444", "#9CA3AF"],
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen p-5 bg-gray-100">
      <h1 className="text-2xl font-bold mb-5 text-gray-800">
        YouTube Comment Sentiment Analysis
      </h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Paste YouTube Video URL"
          value={videoLink}
          onChange={(e) => setVideoLink(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-4"
        />
        <button
          onClick={fetchComments}
          disabled={loading}
          className={`mr-3 px-4 py-2 text-white rounded-md ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
        >
          Fetch Comments
        </button>
        <button
          onClick={analyzeSentiment}
          disabled={loading || comments.length === 0}
          className={`px-4 py-2 text-white rounded-md ${
            loading || comments.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600"
          }`}
        >
          Analyze Sentiment
        </button>
      </div>

      {sentiments.length > 0 && (
        <div className="mb-6">
          <label className="font-medium mr-4">Sort by Sentiment:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="default">All Comments</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      )}

      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {sentiments.length > 0 && !loading && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Sentiment Distribution
          </h3>
          <div className="mt-4">
            <Pie data={data} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {sortedComments().map((sentiment, index) => (
          <div key={index} className="p-4 bg-white shadow-md rounded-lg">
            <p className="font-medium">Comment:</p>
            <p>{comments[index]}</p>
            <p className="mt-3 text-green-600">
              Sentiment: {sentiment.sentiment} (Score:{" "}
              {sentiment.sentimentScore})
            </p>
          </div>
        ))}
      </div>

      {comments.length > 0 && sentiments.length === 0 && !loading && (
        <p className="text-gray-500 mt-4">
          Click "Analyze Sentiment" to view results.
        </p>
      )}
    </div>
  );
}

export default App;
