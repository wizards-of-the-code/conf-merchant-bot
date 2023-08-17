import { ObjectId } from 'mongodb';
import { Participant } from '../types';
import TelegramBot from '../TelegramBot';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // Get event_id from actionString
    const actionString = ctx.match.input;
    const eventIdStr = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));

    // Check if user if already in DB
    const participant = await bot.dbManager.getParticipant(ctx.from!.id);
    let participantId: ObjectId | undefined;

    if (!participant) {
      // If no - create new user first
      const newUser: Participant = {
        tg_id: ctx.from!.id,
        tg_first_name: ctx.from!.first_name,
        tg_last_name: ctx.from!.last_name,
        events: [],
      };

      participantId = await bot.dbManager.addParticipant(newUser);
      console.log(`New user ${participantId} created!`);
    } else {
      participantId = participant._id;
    }

    if (participantId) {
      // If yes - add him to participates array of Event object
      const addToEventResult = await bot.dbManager.addParticipantToEvent(eventIdStr, participantId);
      if (addToEventResult.modifiedCount > 0) {
        ctx.editMessageReplyMarkup(undefined);
        ctx.reply(`Отлично, вы успешно записаны на конференцию ${eventIdStr}.`);
      } else {
        // TODO: Easier to hide the button or change it to "Unsibscribe" in the future
        ctx.editMessageReplyMarkup(undefined);
        ctx.reply('Вы уже записаны на эту конференцию! :)');
        // console.log('You\'re already participating in this event!');
      }
    }
  });
};

export default participate;
