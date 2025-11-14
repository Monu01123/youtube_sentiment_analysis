import axios from "axios";
import Sentiment from "sentiment";
import { HF_API_KEY, TRANSFORMER_MODEL } from "../config/env.js";

let transformer = null;
let transformerReady = false;

export async function initTransformer() {
  try {
    const { pipeline } = await import("@xenova/transformers");
    transformer = await pipeline("sentiment-analysis", TRANSFORMER_MODEL);
    transformerReady = true;
    console.log("🔥 Local transformer loaded:", TRANSFORMER_MODEL);
  } catch (err) {
    transformerReady = false;
    console.warn(
      "⚠ Local transformer unavailable, falling back to HF or sentiment lib"
    );
  }
}

const sentiment = new Sentiment();

export async function analyzeBatch(texts) {
  // Use HuggingFace Inference API when HF_API_KEY present
  if (HF_API_KEY) {
    try {
      const url = `https://api-inference.huggingface.co/models/${TRANSFORMER_MODEL}`;
      const response = await axios.post(url, texts, {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      });
      return response.data.map((arr) => {
        const top = arr[0];
        const label = top.label.toLowerCase();
        return {
          label: label.includes("neg")
            ? "negative"
            : label.includes("pos")
            ? "positive"
            : "neutral",
          score: top.score,
        };
      });
    } catch (err) {
      console.warn("HF API failed, falling back:", err.message);
    }
  }

  // Local transformer
  if (transformerReady && transformer) {
    try {
      const out = await transformer(texts);
      return out.map((r) => ({
        label: r.label.includes("neg")
          ? "negative"
          : r.label.includes("pos")
          ? "positive"
          : "neutral",
        score: r.score,
      }));
    } catch (err) {
      console.warn("Local transformer failed:", err.message);
    }
  }

  // Final fallback
  return texts.map((t) => {
    const r = sentiment.analyze(t);
    return {
      label: r.score > 0 ? "positive" : r.score < 0 ? "negative" : "neutral",
      score: r.score,
    };
  });
}

// Start loading transformer asynchronously
initTransformer();
