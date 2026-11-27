const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN || "9168083803:AAHPqnrfhll-y_PmMg7cTQ2YUlB_BV2SvQk";
const ADMIN_TG_ID = String(process.env.ADMIN_TG_ID || "8914582993");
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || "https://pubg-scrim-live-default-rtdb.firebaseio.com";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "⚡ *PUBG Scrim ID/Pass Botu Hazır*\n\n" +
      "Kullanım:\n`/setroom <oda_1_6> <room_id> <sifre> <harita_saat>`\n" +
      "Örnek:\n`/setroom 1 5489210 2026 Erangel-21:00`",
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/setroom(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (String(msg.from.id) !== ADMIN_TG_ID) {
    return bot.sendMessage(chatId, "❌ Bu komutu yalnızca yetkili admin kullanabilir.");
  }

  if (!match || !match[1]) {
    return bot.sendMessage(
      chatId,
      "⚠️ Format hatalı.\nÖrnek: `/setroom 1 5489210 2026 Erangel-21:00`",
      { parse_mode: "Markdown" }
    );
  }

  const parts = match[1].trim().split(/\s+/);
  if (parts.length < 3) {
    return bot.sendMessage(
      chatId,
      "⚠️ En az `<oda_no> <room_id> <sifre>` girilmelidir."
    );
  }

  const roomNum = Number(parts[0]);
  const roomId = parts[1];
  const pass = parts[2];
  const mapInfo = parts.slice(3).join(" ");

  if (![1, 2, 3, 4, 5, 6].includes(roomNum)) {
    return bot.sendMessage(chatId, "❌ Oda numarası 1 ile 6 arasında olmalıdır.");
  }

  try {
    const baseUrl = FIREBASE_DB_URL.replace(/\/+$/, "");
    const payload = {
      roomId: String(roomId),
      pass: String(pass),
      updatedAt: Date.now()
    };

    if (mapInfo) {
      payload.map = mapInfo.replace(/-/g, " ");
    }

    await axios.patch(`${baseUrl}/rooms/${roomNum}.json`, payload);

    bot.sendMessage(
      chatId,
      `✅ *Oda #${roomNum} güncellendi!*\n` +
        `🔑 ID: \`${roomId}\`\n` +
        `🔒 Şifre: \`${pass}\`` +
        (mapInfo ? `\n🗺️ Harita/Saat: ${mapInfo.replace(/-/g, " ")}` : ""),
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Firebase yazma hatası:", err.message);
    bot.sendMessage(chatId, "❌ Firebase veritabanına yazılırken hata oluştu.");
  }
});
