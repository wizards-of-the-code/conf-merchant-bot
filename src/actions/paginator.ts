// import { Markup, Telegraf } from 'telegraf';
import TelegramBot from '../TelegramBot';

const paginator = async (bot: TelegramBot) => {
  bot.action(/page_(\d+)/, async (ctx) => {
    const actionString = ctx.match.input;
    const pageNumber = actionString.slice(actionString.lastIndexOf('_') + 1);
    console.log(pageNumber);
  });
};

export default paginator;
