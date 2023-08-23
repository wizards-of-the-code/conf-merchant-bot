import { ObjectId } from "mongodb";
import { IBotContext } from "../context/BotContext.interface";
import { Participant, ParticipantEventDetails } from "../types";
import TelegramBot from "../TelegramBot";

export default async function addParticipant(ctx: IBotContext, bot: TelegramBot, eventId: ObjectId, role: string): Promise<Boolean> {
    try{
        const eventDetail: ParticipantEventDetails = {
            event_id: eventId,
            is_payed: false,
            role: role,
        };

        const newUser: Participant = {
            tg_id: ctx.from!.id,
            tg_first_name: ctx.from!.first_name,
            tg_last_name: ctx.from!.last_name,
            events: [
                eventDetail
            ],
        };

        const participantId = await bot.dbManager.insertParticipant(newUser);
        console.log(`New user ${participantId} created!`);
        return true;
    } catch (error) {
        console.log('Error! Can not create user!');
        return false;
    }
}
