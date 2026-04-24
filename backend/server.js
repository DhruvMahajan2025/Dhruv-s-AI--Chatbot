import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

/* MongoDB */
mongoose.connect("mongodb+srv://Dhruv:DhruvMahajan12345678@chatbot-cluster.brikqhj.mongodb.net/universalAI")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB error:", err));

/* Schema */
const chatSchema = new mongoose.Schema({
  name: String,
  messages: [ 
    {
      role: String,
      text: String
    }
  ]
});

const Chat = mongoose.model("Chat", chatSchema);

/* Groq */
const groq = new Groq({
  apiKey: "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"
});

/* ROUTES */

// GET ALL
app.get("/chats", async (req, res) => {
  const chats = await Chat.find().sort({ _id: -1 });
  res.json(chats);
});

// GET ONE
app.get("/chat/:id", async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  res.json(chat);
});

// DELETE
app.delete("/chat/:id", async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* CHAT */
app.post("/chat", async (req, res) => {
  try {
    const { message, chatId } = req.body;

    let chat = null;

    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    // Create new chat if not found
    if (!chat) {
      chat = new Chat({
        name: message.substring(0, 30), 
        messages: []
      });
    }

    // Save user message
    chat.messages.push({ role: "user", text: message });

    let reply = "AI failed";

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: message }]
      });

      reply = response.choices[0].message.content;

    } catch (err) {
      console.log("AI ERROR:", err.message);
    }

    // Save bot reply
    chat.messages.push({ role: "bot", text: reply });

    await chat.save();

    res.json({
      reply,
      chatId: chat._id
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* START */
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
