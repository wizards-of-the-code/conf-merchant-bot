import { ObjectId } from 'mongodb';
import { IBotContext } from '../context/IBotContext';
import { Participant, ParticipantEventDetails, TelegramUser } from '../types';

export default async function addParticipant(
  ctx: IBotContext,
  eventId: ObjectId,
  role: string,
): Promise<Participant | null> {
  try {
    const user: TelegramUser = {
      id: ctx.from!.id,
      username: ctx.from!.username!,
      first_name: ctx.from!.first_name,
      last_name: ctx.from!.last_name,
    };

    const eventDetail: ParticipantEventDetails = {
      event_id: eventId,
      is_payed: false,
      role,
      attended: false,
    };

    const newUser: Participant = {
      tg: user,
      events: [
        eventDetail,
      ],
    };

    return newUser;
  } catch (error) {
    console.log('Error! Can not create user!');

    return null;
  }
}
