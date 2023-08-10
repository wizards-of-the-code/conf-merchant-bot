import { Markup } from "telegraf";
import { TelegramBot } from "../TelegramBot";
import { Event } from "../types";

export const getEvents = async (bot: TelegramBot) => {

  bot.action("action_get_events", async (ctx) => {
    let arr: Event[] = await bot.dbManager.getEvents();

    ctx.deleteMessage();
    let confs = arr.map(item => [Markup.button.callback(`${item.location} ${item.datetime}`, `action_get_info_${item.name}`)]);

    ctx.reply(`Какая именно конференция вас интересует?`, Markup.inlineKeyboard([
      ...confs
    ]));
  });

}