import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Participant, TelegramUser, Event, Message } from '../types';
import TelegramBot from '../TelegramBot';
import parseActionParam from '../utils/parseActionParam';
import sendMessage from '../utils/sendMessage';
import switchRoleMessage from '../utils/switchRoleMessage';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // Get role from actionString
    const actionString = ctx.match.input;
    const role: string = parseActionParam(actionString);
    const eventId = ctx.session.selectedEvent!._id;

    // TODO: Check if event exists
    const event = await bot.dbManager.getDocumentData<Event>('events', { _id: eventId });

    // Check if user if already in DB
    let participant = await bot.dbManager.getDocumentData<Participant>('participants', {
      'tg.id': ctx.from!.id,
    });
    let participantId: ObjectId | undefined;

    if (!participant) {
      // If no - create new user first
      const user: TelegramUser = {
        id: ctx.from!.id,
        username: ctx.from!.username!,
        first_name: ctx.from!.first_name,
        last_name: ctx.from!.last_name,
      };

      participant = {
        tg: user,
        events: [],
      };

      participantId = await bot.dbManager.insertParticipant(participant);
      participant._id = participantId;
    }

    // Add him to participates array of Event object
    await bot.dbManager.addParticipantToEvent(new ObjectId(eventId), participant);

    // Add event details to Participant entry
    await bot.dbManager.addEventDetailsToParticipant(new ObjectId(eventId), participant!, role);

    const userMessage = `Отлично, вы успешно записаны на конференцию ${event!.name}.`;

    ctx.editMessageReplyMarkup(undefined);

    const buttons: (InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton)[][] = [
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${eventId}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ],
    ];

    // Get message from DB
    const roleMessage = await bot.dbManager.getDocumentData<Message>('messages', {
      name: switchRoleMessage(role),
    });

    if (roleMessage) {
      /* If role need special message - send confirmation first and then
         send roleMessages with buttons attache to the last one */
      await ctx.reply(userMessage);
      await sendMessage(roleMessage, ctx, buttons);
    } else {
      // Else just send confirmation message with buttons
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

export default participate;
