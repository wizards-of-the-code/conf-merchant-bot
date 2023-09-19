import TelegramBot from '../TelegramBot';
import { sendEventsMessage } from '../actions/getEvents';
import { IBotContext } from '../context/IBotContext';

/**
 * Function used to avoid bot crash when bot was restarted and session
 * data was not saved to session.json.
 * @param {TelegramBot} bot - Bot instance.
 * @param {IBotContext} ctx - Current IBotContext.
 */
const handleExpiredSession = async (bot: TelegramBot, ctx: IBotContext) => {
  await ctx.reply('ℹ️ К сожалению ваша сессия устарела, пожалуйста, выберите нужную конференцию снова.');
  sendEventsMessage(bot, ctx);
};

export default handleExpiredSession;
