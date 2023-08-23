import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant, TelegramUser } from '../types';
import TelegramBot from '../TelegramBot';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // Get event_id from actionString
    const actionString = ctx.match.input;
    const eventId: ObjectId = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));

    // TODO: Check if event exists
    const event = await bot.dbManager.getEventById(eventId);

    // Check if user if already in DB
    const participant = await bot.dbManager.getParticipant(ctx.from!.id);
    let participantId: ObjectId | undefined;

    if (!participant) {
      // If no - create new user first
      const user: TelegramUser = {
        id: ctx.from!.id,
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
      };

      const newUser: Participant = {
        tg: user,
        events: [],
      };

      participantId = await bot.dbManager.insertParticipant(newUser);
      console.log(`New user ${participantId} created!`);
    } else {
      participantId = participant._id;
    }

    // If yes - add him to participates array of Event object
    const addToEventResult = await bot.dbManager.addParticipantToEvent(eventId, participantId!);

    let userMessage: string;

    if (addToEventResult.modifiedCount > 0) {
      // Add event details to Participant entry
      await bot.dbManager.addEventDetailsToParticipant(eventId, participantId!, 'participant');
      // TODO: Handle result of addEventDetailsToParticipant

      userMessage = `Отлично, вы успешно записаны на конференцию ${event!.name}.`;
    } else {
      // TODO: Easier to hide the button or change it to "Unsibscribe" in the future
      userMessage = 'Вы уже записаны на эту конференцию! :)';
    }

    ctx.editMessageReplyMarkup(undefined);
    ctx.reply(userMessage, Markup.inlineKeyboard(
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ],
    ));
  });
};

export default participate;
