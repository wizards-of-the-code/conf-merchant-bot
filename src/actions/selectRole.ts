import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';

const selectRole = async (bot: TelegramBot) => {
  bot.action('action_select_role', async (ctx) => {
    // Remove keyboard from last message
    ctx.editMessageReplyMarkup(undefined);

    ctx.reply(
      'Выберите свою роль на мероприятии',
      Markup.inlineKeyboard([
        [Markup.button.callback('Участник', 'action_participate_participant')],
        [Markup.button.callback('Волонтер', 'action_participate_volunteer')],
        [Markup.button.callback('Организатор', 'action_participate_organizer')],
        [Markup.button.callback('Спонсор', 'become_sponsor')],
      ]),
    );
  });
};

export default selectRole;
