const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve your HTML files as static files
app.use(express.static("public"));

// ── PROXY ENDPOINT FOR SUPPORT CHATBOT ──────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages array required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // 🔑 Key stays safe on server
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: system || "You are a helpful support assistant.",
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({ error: data.error?.message || "API error" });
    }

    res.json(data);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PROXY ENDPOINT FOR GOOGLE SHEETS LEAD ──────────────────
app.post("/api/lead", async (req, res) => {
  try {
    const SHEET_URL = "https://script.google.com/macros/s/AKfycbzwZNS9x4-x4oh74jjqIg2V3hEjbrFWxBKBRGWW3c60O3128Jd26b3Z3ADobhN6mh7VQA/exec";

    const response = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    res.json({ status: "success", response: text });
  } catch (err) {
    console.error("Lead submission error:", err);
    res.status(500).json({ error: "Failed to send lead to sheet" });
  }
});

// Health check
app.get("/health", (req, res) => res.json({ status: "DVOC server is running ✅" }));

app.listen(PORT, () => {
  console.log(`✅ DVOC proxy server running at http://localhost:${PORT}`);
});
