import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import Command from './Command';

// Actions imports
import getEvents, { sendEventsMessage } from '../actions/getEvents';
import subscribeToEvent from '../actions/subscribeToEvent';
// eslint-disable-next-line import/no-cycle
import getEventInfo, { sendEventInfoMessage } from '../actions/getEventInfo';
import participate from '../actions/participate';
import sponsorship from '../actions/sponsorship';
import getEventSpeakers from '../actions/getEventSpeakers';
import getEventSchedule from '../actions/getEventSchedule';
import TelegramBot from '../TelegramBot';
import { IBotContext } from '../context/BotContext.interface';
import { messages } from '../constants';

export const sendStartMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  // Get messages array from DB
  const startMessages = await bot.dbManager.getMessagesArray(messages.START_MESSAGES);

  // Send start messages
  for (const msg of startMessages) {
    /* eslint-disable no-await-in-loop --
        * The general idea to wait until each Context reply should be finished
        * until next one should run :)
        */
    await ctx.reply(msg);
  }

  const buttonsArray: (
    InlineKeyboardButton.UrlButton | InlineKeyboardButton.CallbackButton
  )[][] = [
      [Markup.button.url('Telegram', 'https://t.me/peredelanoconfchannel')],
      [Markup.button.url('Instagram', 'https://www.instagram.com/peredelanoconf')],
      [Markup.button.url('Discord', 'https://discord.com/channels/1109396222604738612/1109397021271539783')],
      [Markup.button.url('Github', 'https://github.com/philippranzhin/peredelanoconf')],
      [Markup.button.url('Twitter', 'https://twitter.com/peredelano_conf')],
      [Markup.button.url('Facebook', 'https://www.facebook.com/peredelanoconf')],
      [Markup.button.url('Официальный сайт', 'https://peredelanoconf.com/')],
      [Markup.button.callback('🌟 Стать спонсором', 'action_become_sponsor')]
    ];

  await ctx.reply(
    'Наши социальные сети:',
    Markup.inlineKeyboard([
      ...buttonsArray,
    ]),
  );

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
        sendEventInfoMessage(this.bot, ctx, ctx.startPayload);
      } else {
        console.log('No payload, starting standard sequence.');

        sendStartMessage(this.bot, ctx);
      }
    });

    // ACTION HANDLERS

    // Action: Get all events
    getEvents(this.bot);

    // Action: Subscribe to selected event ** WIP**
    subscribeToEvent(this.bot);

    // Action: Get event by name, saved in Session
    getEventInfo(this.bot);

    // Action: Participate in selected event
    participate(this.bot);

    sponsorship(this.bot);

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
