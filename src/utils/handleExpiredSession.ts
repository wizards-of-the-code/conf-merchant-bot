import TelegramBot, { BotContext } from '../bot/TelegramBot';
import { sendEventsMessage } from '../bot/actions/getEvents';

/**
 * Function used to avoid bot crash when bot was restarted and session
 * data was not saved to session.json.
 * @param {TelegramBot} bot - Bot instance.
 * @param {BotContext} ctx - Current BotContext.
 */
const handleExpiredSession = async (bot: TelegramBot, ctx: BotContext) => {
  await ctx.reply('ℹ️ К сожалению ваша сессия устарела, пожалуйста, выберите нужную конференцию снова.');
  sendEventsMessage(bot, ctx);
};

export default handleExpiredSession;
