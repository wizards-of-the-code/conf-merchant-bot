import TelegramBot from '../TelegramBot';
// import { Markup } from 'telegraf';
// import { Event } from '../types';

const subscribeToEvent = async (bot: TelegramBot) => {
  bot.action('action_subscribe', (ctx) => {
    console.log(ctx);
    ctx.editMessageText('WIP');
  });
};

export default subscribeToEvent;
