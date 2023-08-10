import { Markup } from "telegraf";
import { TelegramBot } from "../TelegramBot";
import { Event } from "../types";
import { isValidUrl } from "../utils/isValidUrl";

export const getEventInfo = async (bot: TelegramBot) => {
  
  bot.action(/action_get_info_/, async (ctx) => {
    let actionString = ctx.match.input;

    // Get action id from context
    const name = actionString.slice(actionString.lastIndexOf('_') + 1);

    if(bot.db) {
      const collection = bot.db.collection<Event>("events");
      const event = await collection.findOne<Event>({name: name});

      // TODO add handler if event doesn't exist
      if(event) {
        // Save event to current session context
        ctx.session.selectedConf = event;

        ctx.deleteMessage();

        // TODO fix any !!!
        const buttonsArray: any = [
          [Markup.button.callback("🗺 Карта фестиваля", "action_event_map")],
          [Markup.button.callback("👨‍👩‍👧‍👦 Участники", "action_speakers")],
          [Markup.button.callback("🗓 Расписание", "action_schedule")],
          [Markup.button.callback("💼 Craft Business", "action_craft_business")],
          [Markup.button.callback("🙋‍♂️ Голосование", "action_poll")],
          [Markup.button.callback("🧩 Вопросы и ответы", "action_qna")],
          [Markup.button.callback("🎟 Билеты", "action_tickets")],
          [Markup.button.callback("📝 Записаться", "action_participate")],
        ];

        // Add Landing url button if event'link is valid url
        if(await isValidUrl(event.link)) {
          buttonsArray.push([Markup.button.url("🌐 Сайт фестиваля", event.link)]);
        }

        if(await isValidUrl(event.tg_channel)) {
          buttonsArray.push([Markup.button.url("📣 Телеграм канал фестиваля", event.tg_channel)]);
        }

        buttonsArray.push([Markup.button.callback("◀️ Назад", "action_get_events"), Markup.button.callback("🔼 В главное меню", "action_start")]);
        
        ctx.reply(`
          Локация: ${event.location}\n\n${event.description}\n\nДата и время: ${event.datetime}\n\nЦена: ${event.currency} ${event.current_price}
        `, Markup.inlineKeyboard(buttonsArray));
      }
    }
  });
  
}