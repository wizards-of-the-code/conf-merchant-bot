import TelegramBot from '../TelegramBot';
import logger from '../../data/logger/logger';
import getErrorMsg from '../../utils/getErrorMessage';
import { sendEventsMessage } from './getEvents';

const menu = async (bot: TelegramBot) => {
  bot.action('menu', async (ctx) => {
    await ctx.deleteMessage().catch(
      (error) => {
        logger.error(`Error when trying to delete message: ${getErrorMsg(error)}`);
      },
    );

    ctx.session.currentMessage = -1;
    await sendEventsMessage(bot, ctx);
  });
};

export default menu;
