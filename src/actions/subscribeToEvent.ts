import { Markup } from "telegraf";
import { TelegramBot } from "../TelegramBot";
import { Event } from "../types";

export const subscribeToEvent = async (bot: TelegramBot) => {
  bot.action("action_subscribe", (ctx) => {
    console.log(ctx);
    ctx.editMessageText("WIP");
  })
}