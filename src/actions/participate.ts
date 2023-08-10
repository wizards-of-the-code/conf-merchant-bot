import { Participant } from '../types';
import TelegramBot from '../TelegramBot';

const participate = async (bot: TelegramBot) => {
  bot.action('action_participate', async (ctx) => {
    const event = ctx.session.selectedConf;

    if (ctx.from && event) {
      const user: Participant = {
        tg_id: ctx.from?.id,
        event_name: event.name,
        tg_first_name: ctx.from?.first_name,
        tg_last_name: ctx.from?.last_name,
        email: '',
      };

      const result: boolean = await bot.dbManager.addParticipant(event, user);

      if (result) {
        ctx.editMessageReplyMarkup(undefined);
        // TODO: add datetime converted to readable format
        ctx.reply(`Отлично, вы успешно записаны на "${event.name}", которое состоится ${event.datetime}. Бот обязательно напомнит вам за сутки до события!`);
      } else {
        // TODO: Easier to hide the button or change it to "Unsibscribe" in the future
        ctx.editMessageReplyMarkup(undefined);
        ctx.reply('Вы уже записаны на эту конференцию! :)');
      }
    } else {
      throw new Error('Internal bot error.');
    }
  });
};

export default participate;
