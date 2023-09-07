import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant, Event } from '../types';
import TelegramBot from '../TelegramBot';

const cancelParticipation = async (bot: TelegramBot) => {
  bot.action(/action_cancel_participation/, async (ctx) => {
    const eventId = ctx.session.selectedEvent!._id;

    // TODO: Check if event exists
    const event = await bot.dbManager.getDocumentData<Event>('events', {
      _id: new ObjectId(eventId),
    });

    // Get participant from DB
    const participant: Participant | null = await bot.dbManager.getDocumentData('participants', {
      'tg.id': ctx.from!.id,
    });

    if (!participant) {
      console.log('User is not participated');
    } else {
      const removeFromEventResult = await bot.dbManager.removeParticipantFromEvent(
        new ObjectId(eventId),
        participant,
      );

      let userMessage: string;

      if (removeFromEventResult.modifiedCount > 0) {
        // Add event details to Participant entry
        await bot.dbManager.removeEventDetailsFromParticipant(new ObjectId(eventId), participant);
        // TODO: Handle result of addEventDetailsToParticipant

        userMessage = `Ваша регистрация на конференцию "${event!.name}" успешно отменена.`;
      } else {
        userMessage = 'По какой-то причине вы и не были записаны на эту конференцию.';
      }

      ctx.editMessageReplyMarkup(undefined);
      ctx.reply(
        userMessage,
        Markup.inlineKeyboard([
          Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
          Markup.button.callback('🔼 В главное меню', 'action_get_events'),
        ]),
      );
    }
  });
};

export default cancelParticipation;
