import { TeleBot } from "TeleBot";
import { TELE_BOT_ID } from "utils/constants";

const teleBot = new TeleBot(TELE_BOT_ID);
teleBot.init();
