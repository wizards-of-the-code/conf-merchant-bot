import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, ScheduleItem } from '../types';

const getEventSchedule = async (bot: TelegramBot) => {
  bot.action(/action_get_schedule_/, async (ctx) => {
    const event: Event | undefined = ctx.session.selectedConf;

    if (!event) {
      // TODO: Implement logs and store this errors there
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    } else {
      /* eslint-disable max-len */
      const scheduleItemsArr: ScheduleItem[] = await bot.dbManager.getEventScheduleItems(event._id!);

      // Remove keyboard from last message
      ctx.editMessageReplyMarkup(undefined);

      const messageArray: String[] = [`🗓 Расписание событий <b>${event.name}</b>:\n`];

      // TODO: Add filtration by date

      // Collect all Schedule Items in one message
      for (const item of scheduleItemsArr) {
        messageArray.push(`<b>${item.time}: ${item.title}</b>`);
      }

      await ctx.replyWithHTML(
        messageArray.join('\n'),
        {
          parse_mode: 'HTML',
        },
      );

      // Reply footer with menu buttons
      ctx.reply('Что делаем дальше?', Markup.inlineKeyboard(
        [
          Markup.button.callback('◀️ Назад', `action_get_info_${ctx.session.selectedConf!._id!.toString()}`),
          Markup.button.callback('🔼 В главное меню', 'action_get_events'),
        ],
      ));
    }
  });
};

export default getEventSchedule;
