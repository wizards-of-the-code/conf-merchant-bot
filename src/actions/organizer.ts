import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import { Participant, ParticipantEventDetails } from '../types';
import TelegramBot from '../TelegramBot';
import addParticipant from './addParticipant';

const organizerRole = async (bot: TelegramBot) => {
    bot.action(/organizer_/, async (ctx) => {
        const actionString = ctx.match.input;
        const eventId: ObjectId = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));
        const event = await bot.dbManager.getEventById(eventId);

        const participant = await bot.dbManager.getParticipant(ctx.from!.id);
        let participantId: ObjectId | undefined;

        if (!participant) {
            const addedNewParticipant = addParticipant(ctx, bot, eventId, 'organizer');

            if (!addedNewParticipant) { ctx.reply('Невозможно добавить этого участника!') }

        } else {
            participantId = participant._id;
        }

        const addToEventResult = await bot.dbManager.addParticipantToEvent(eventId, participantId!);

        let userMessage: string;

        if (addToEventResult.modifiedCount > 0) {
            // Add event details to Participant entry
            await bot.dbManager.addEventDetailsToParticipant(eventId, participantId!);
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

export default organizerRole