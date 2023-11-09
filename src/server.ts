import { cors } from "@elysiajs/cors";
import axios from "axios";
import { Elysia } from "elysia";
import { TELEGRAM_API, TELE_BOT_ID, WEBHOOK_URL } from "./utils/constants";
import { TeleBot, authController, checkHealth } from "./controllers";

const teleBot = new TeleBot(TELE_BOT_ID);
teleBot.init();

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(checkHealth)
  .use(authController)
  .listen(3000, async () => {
    const res = await axios.get(
      `${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`,
    );
    console.log(res.data);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
    );
  });
