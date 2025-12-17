const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require("express");

const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = "sk_16ed24f0ed231e3db9508cdc93839cf2abbe9a68455a87e6"; // <-- अपनी secret key यहाँ डालो
const VOICE_ID = "9F4C8ztpNUmXkdDDbz3J";   // <-- अपने voice ID

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// TTS Endpoint
app.post("/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    console.log("TTS Request Text:", text);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": API_KEY,
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text: text,
        voice_settings: { stability: 0.45, similarity_boost: 0.75 }
      })
    });

    console.log("TTS API Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS API Error:", errorText);
      return res.status(500).send(errorText);
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
