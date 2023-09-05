import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant, Event, LogEntry } from '../types';
import TelegramBot from '../TelegramBot';
import { statuses } from '../constants';

const cancelParticipation = async (bot: TelegramBot) => {
  bot.action(/action_cancel_participation/, async (ctx) => {
    const eventId = ctx.session.selectedEvent!._id;

    // TODO: Check if event exists
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: new ObjectId(eventId) });

    // Get participant from DB
    const participant: Participant | null = await bot.dbManager.getDocumentData('participants', { 'tg.tg_id': ctx.from!.id });

    if (!participant) {
      console.log('User is not participated');
      return;
    }

    const logData: LogEntry = {
      datetime: new Date(),
      event: event?._id,
      initiator: participant.tg,
      status: statuses.EVENT_UPDATE,
      message: `From event ${event?.name} removed participant @${participant.tg.username}`,
    };

    await bot.dbManager.insertOrUpdateDocumentToCollection(
      'events',
      { _id: event?._id },
      { $pull: { participants: participant._id } },
      logData,
    );

    await bot.dbManager.insertOrUpdateDocumentToCollection(
      'participants',
      { _id: participant._id },
      { $pull: { events: { event_id: event?._id } } },
    );

    // TODO: Handle result of addEventDetailsToParticipant
    ctx.editMessageReplyMarkup(undefined);
    ctx.reply(`Ваша регистрация на конференцию "${event!.name}" успешно отменена.`, Markup.inlineKeyboard(
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ],
    ));
  });
};

export default cancelParticipation;
