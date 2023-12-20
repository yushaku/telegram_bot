import { TeleBot } from "TeleBot";
import mongoose from "mongoose";
import { MONGODB_URL, MONGO_NAME, TELE_BOT_ID } from "utils/constants";
import { NODE_ENV, chainId } from "./utils/token";

const teleBot = new TeleBot(TELE_BOT_ID);
try {
  await teleBot.init().then(() => {
    console.info(`✅ Telegram bot is running 🤖`);
    console.info(`✅ Run on Chain: ${NODE_ENV} with chain id: ${chainId} 🚀`);
  });
  await mongoose
    .connect(MONGODB_URL, { dbName: MONGO_NAME, autoCreate: true })
    .then(() => console.info("✅ MongoDB connected 🗄️"));
} catch (error) {
  console.error(error);
  process.exit(1);
}
