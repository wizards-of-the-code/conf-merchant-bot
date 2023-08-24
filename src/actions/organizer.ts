import { ObjectId } from 'mongodb';
import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import addParticipant from './addParticipant';

const organizerRole = async (bot: TelegramBot) => {
    bot.action(/organizer_/, async (ctx) => {
        const actionString = ctx.match.input;
        const eventId: ObjectId = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));
        const event = await bot.dbManager.getEventById(eventId);
        const role = 'organizer';

        const participant = await bot.dbManager.getParticipant(ctx.from!.id);
        let participantId: ObjectId | undefined;

        if (!participant) {
            const newParticipant = await addParticipant(ctx, eventId, role);
            if (newParticipant) {
                const participantId = await bot.dbManager.insertParticipant(newParticipant);
                console.log(`New user ${participantId} created!`);
            } 
            
        } else {
            participantId = participant._id;
        }

        const addToEventResult = await bot.dbManager.addParticipantToEvent(eventId, participantId!);

        let userMessage: string;

        if (addToEventResult.modifiedCount > 0) {
            // Add event details to Participant entry
            await bot.dbManager.addEventDetailsToParticipant(eventId, participantId!, role);
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