import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant } from '../types';
import TelegramBot from '../TelegramBot';

const participantRole = async (bot: TelegramBot) => {
  bot.action(/action_role_/, async (ctx) => { 
    const actionString = ctx.match.input;
    const eventId: ObjectId = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));
    const event = await bot.dbManager.getEventById(eventId);
    ctx.session.selectedConf = event;
    ctx.reply('Выберите свою роль на мероприятии', Markup.inlineKeyboard(
      [
          [Markup.button.callback('Организатор', `organizer_${eventId}`)],
          [Markup.button.callback('Волонтер', `volunteer_${eventId}`)],
          [Markup.button.callback('Участник', `participant_${eventId}`)],
          [Markup.button.callback('Спонсор', `action_become_sponsor`)],
      ],
    ));
  });
};

export default participantRole