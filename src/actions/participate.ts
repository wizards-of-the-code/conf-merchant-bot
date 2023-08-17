import { ObjectId } from 'mongodb';
import { Participant } from '../types';
import TelegramBot from '../TelegramBot';

const participate = async (bot: TelegramBot) => {
  bot.action(/action_participate_/, async (ctx) => {
    // get event_id from actionString
    const actionString = ctx.match.input;
    const eventIdStr = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));
    console.log('EventID: ', eventIdStr);

    // check if user if already in DB
    const participant = await bot.dbManager.getParticipant(ctx.from!.id);
    let participantId: ObjectId | undefined;

    if (!participant) {
      // if no - create new user first
      const newUser: Participant = {
        tg_id: ctx.from!.id,
        tg_first_name: ctx.from!.first_name,
        tg_last_name: ctx.from!.last_name,
        events: [],
      };

      // TODO: Add try-catch and error handling
      participantId = await bot.dbManager.addParticipant(newUser);
      console.log(`New user ${participantId} created!`);
    } else {
      participantId = participant._id;
    }

    if (participantId) {
      // if yes - add him to participates array of Event object
      const result = await bot.dbManager.addParticipantToEvent(eventIdStr, participantId);
      if (result.modifiedCount > 0) {
        console.log(`User ${participantId} added to event ${eventIdStr}!`);
      } else {
        console.log('You\'re already participating in this event!');
      }
    }

    // const event = ctx.session.selectedConf;

    // if (ctx.from && event) {
    //   const user: Participant = {
    //     tg_id: ctx.from?.id,
    //     event_id: new ObjectId(event._id!),
    //     tg_first_name: ctx.from?.first_name,
    //     tg_last_name: ctx.from?.last_name,
    //     email: '',
    //   };

    //   const result: boolean = await bot.dbManager.addParticipant(event, user);

    //   if (result) {
    //     ctx.editMessageReplyMarkup(undefined);
    //     // TODO: add datetime converted to readable format
    //     ctx.reply(`Отлично, вы успешно записаны на
    //  "${event.name}", которое состоится ${event.datetime}.
    // Бот обязательно напомнит вам за сутки до события!`);
    //   } else {
    //     // TODO: Easier to hide the button or change it to "Unsibscribe" in the future
    //     ctx.editMessageReplyMarkup(undefined);
    //     ctx.reply('Вы уже записаны на эту конференцию! :)');
    //   }
    // } else {
    //   throw new Error('Internal bot error.');
    // }
  });
};

export default participate;
