import { Markup } from 'telegraf';
import Command from './Command';

// Actions imports
import getEvents from '../actions/getEvents';
import subscribeToEvent from '../actions/subscribeToEvent';
import getEventInfo from '../actions/getEventInfo';
import participate from '../actions/participate';

class StartCommand extends Command {
  handle(): void {
    this.bot.start((ctx) => {
      // Save user id to session
      ctx.session.userId = ctx.from?.id;

      ctx.reply('Чем я могу вам помочь?', Markup.inlineKeyboard([
        [Markup.button.callback('Информация о событиях', 'action_get_events')],
        [Markup.button.callback('Подписаться на событие', 'action_subscribe')],
      ]));
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

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export default StartCommand;
