import Command from './Command';

// Actions imports
import getEvents, { sendEventsMessage } from '../actions/getEvents';
// eslint-disable-next-line import/no-cycle
import getEventInfo, { sendEventInfoMessage } from '../actions/getEventInfo';
import participate from '../actions/participate';
import getEventSpeakers from '../actions/getEventSpeakers';
import getEventSchedule from '../actions/getEventSchedule';
import TelegramBot, { BotContext } from '../TelegramBot';
import { messages } from '../../data/constants';
import sendMessage from '../../utils/sendMessage';
import sponsorship from '../actions/sponsorship';
import cancelParticipation from '../actions/cancelParticipation';
import { Message } from '../../data/types';
import CommandSetter from './CommandSetter';
import logger from '../../data/logger/logger';
import menu from '../actions/menu';

export const sendStartMessage = async (bot: TelegramBot, ctx: BotContext) => {
  // Get message from DB
  const startMessage = await bot.dbManager.getDocumentData<Message>('messages', { name: messages.START_MESSAGES });

  if (startMessage) {
    await sendMessage(startMessage, ctx, bot);
  }

  ctx.session.currentMessage = -1;

  setTimeout(() => sendEventsMessage(bot, ctx), 2000);
};

class StartCommand extends Command {
  handle(): void {
    this.bot.start(async (ctx) => {
      // Save user id to session
      ctx.session.userId = ctx.from?.id;

      // Check for startPayload - parameter to link bot to a certain event (for marketing purposes)
      if (ctx.startPayload) {
        // Call certain event action
        logger.info(`Bot started with payload. User: ${ctx.from.username}`);
        sendEventInfoMessage(this.bot, ctx, ctx.startPayload);
      } else {
        logger.info(`Bot started without payload. User: ${ctx.from.username}`);

        sendStartMessage(this.bot, ctx);
      }

      const commandSetter = new CommandSetter(this.bot);
      commandSetter.setCommands();
    });
    // ACTION HANDLERS

    // Action: Get all events
    getEvents(this.bot);

    // Action: main menu
    menu(this.bot);

    // Action: Get event by name, saved in Session
    getEventInfo(this.bot);

    // Action: Participate in selected event
    participate(this.bot);

    sponsorship(this.bot);
    // Action: Cancel participation in selected event
    cancelParticipation(this.bot);

    // Action: Show speakers for a selected event
    getEventSpeakers(this.bot);

    // Action: Show schedule for a selected event
    getEventSchedule(this.bot);

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export default StartCommand;
