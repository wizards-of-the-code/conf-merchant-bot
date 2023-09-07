import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import formatTimeToHhMmUTC from '../utils/timeFormat';

const displayEventSchedule = async (ctx: any, event: Event) => {
  const messageLines: string[] = [`🗓 Расписание событий <b>${event.name}</b>:\n`];

  // Collect all Schedule Items in one message
  for (const item of event.schedule) {
    messageLines.push(`<b>${formatTimeToHhMmUTC(item.date)}: ${item.title}</b>`);
  }

  await ctx.replyWithHTML(
    messageLines.join('\n'),
    {
      parse_mode: 'HTML',
    },
  );

  // Reply footer with menu buttons
  ctx.reply('Что делаем дальше?', Markup.inlineKeyboard(
    [
      Markup.button.callback('◀️ Назад', `action_get_info_${event._id}`),
      Markup.button.callback('🔼 В главное меню', 'action_get_events'),
    ],
  ));
};

const getEventSchedule = async (bot: TelegramBot) => {
  bot.action(/action_get_schedule_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
      return;
    }

    // Remove keyboard from the last message
    ctx.editMessageReplyMarkup(undefined);

    await displayEventSchedule(ctx, event);
  });
};

export default getEventSchedule;
