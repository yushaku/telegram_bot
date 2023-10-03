import { cors } from "@elysiajs/cors";
import axios from "axios";
import { Elysia } from "elysia";
import { TELEGRAM_API, WEBHOOK_URL } from "./utils/constants";
import { authController, checkHealth } from "./controllers";

const init = async () => {
  const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
  console.log(res.data);
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
};

const app = new Elysia()
  .use(cors({ origin: "*" }))
  .use(checkHealth)
  .use(authController)
  .listen(3000, async () => {
    await init();
  });
