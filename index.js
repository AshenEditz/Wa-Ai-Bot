const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');
require('dotenv').config();

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    // 🧾 Menu command
    if (text.toLowerCase() === ".menu") {
      const menu = `🧠 *Gemini WhatsApp Bot Menu*

📍 Type any message to chat with Gemini AI.
📜 *.menu* – Show this menu.
👤 Your ID: ${jid}

Bot powered by Gemini AI.
Made for Replit + GitHub users.`;

      await sock.sendMessage(jid, { text: menu });
      return;
    }

    // 🤖 Gemini AI response
    const reply = await getGeminiReply(text);
    await sock.sendMessage(jid, { text: reply });
  });
}

async function getGeminiReply(userInput) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: userInput }] }]
      }
    );
    return res.data.candidates[0].content.parts[0].text || '🤖 No reply.';
  } catch (err) {
    console.error("Gemini Error:", err?.response?.data || err.message);
    return "❌ Error from Gemini API.";
  }
}

connectToWhatsApp();
