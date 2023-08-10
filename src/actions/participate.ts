import { Participant } from "../types";
import { TelegramBot } from "../TelegramBot";

export const participate = async (bot: TelegramBot) => {

  bot.action("action_participate", async (ctx) => {
    const event = ctx.session.selectedConf;

    if(ctx.from && event) {
      const user: Participant = {
        tg_id: ctx.from?.id,
        event_name: event.name,
        tg_first_name: ctx.from?.first_name,
        tg_last_name: ctx.from?.last_name,
        email: "",
      }

      // TODO: check if user is not already participated in this event
      if(bot.db) {
        const collection = bot.db.collection<Participant>("participants");

        // Check if user is not already participated in this event
        const isAlreadyPatricipated = await collection.findOne<Participant>({tg_id: ctx.from.id, event_name: event.name});

        if(!isAlreadyPatricipated) {
          const result = await collection.insertOne(user);
  
          if(result.acknowledged) {
            ctx.editMessageReplyMarkup(undefined);
            // TODO: add datetime converted to readable format
            ctx.reply(`Отлично, вы успешно записаны на "${event.name}", которое состоится ${event.datetime}. Бот обязательно напомнит вам за сутки до события!`);
          } else {
            ctx.reply(`Кажется что-то пошло не так.`);
          }
        } else {
          // ctx.editMessageReplyMarkup(undefined);
          ctx.reply("Вы уже записаны на эту конференцию! :)");
        }

      }
    }
  });

}