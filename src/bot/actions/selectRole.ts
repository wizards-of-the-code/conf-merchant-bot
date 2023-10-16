import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';

const selectRole = async (bot: TelegramBot) => {
  bot.action('role', async (ctx) => {
    // Remove keyboard from last message
    ctx.editMessageReplyMarkup(undefined);

    ctx.reply('Выберите свою роль на мероприятии', Markup.inlineKeyboard(
      [
        [Markup.button.callback('Участник', 'signup_participant')],
        [Markup.button.callback('Волонтер', 'signup_volunteer')],
        [Markup.button.callback('Организатор', 'signup_organizer')],
        [Markup.button.callback('Спонсор', 'sponsorship')],
      ],
    ));
  });
};

export default selectRole;
