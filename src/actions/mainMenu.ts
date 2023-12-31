import TelegramBot from '../TelegramBot';
import logger from '../logger/logger';
import getErrorMsg from '../utils/getErrorMessage';
import { sendEventsMessage } from './getEvents';

const mainMenu = async (bot: TelegramBot) => {
  bot.action('show_main_manu', async (ctx) => {
    await ctx.deleteMessage().catch(
      (error) => {
        logger.error(`Error when trying to delete message: ${getErrorMsg(error)}`);
      },
    );

    ctx.session.currentMessage = -1;
    await sendEventsMessage(bot, ctx);
  });
};

export default mainMenu;
