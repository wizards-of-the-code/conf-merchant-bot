import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import { Event, ScheduleItem, Speaker } from '../types';
import { isValidUrl } from '../utils/isValidUrl';

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/action_get_info_/, async (ctx) => {
    const actionString = ctx.match.input;

    // Get action id from context
    const eventId = new ObjectId(actionString.slice(actionString.lastIndexOf('_') + 1));

    const event: Event | null = await bot.dbManager.getEventById(eventId);

    if (!event) {
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    } else {
      // Save event to current session context
      ctx.session.selectedConf = event;

      ctx.deleteMessage();

      const buttonsArray: (
        InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
      )[][] = [
        [Markup.button.callback('📝 Зарегистрироваться', 'action_participate')],
      ];

      const schedule: ScheduleItem[] = await bot.dbManager.getEventScheduleItems(eventId);
      // TODO: Change unshift to push later
      if (schedule.length > 0) {
        buttonsArray.unshift([Markup.button.callback('🗓 Расписание', `action_get_schedule_${eventId}`)]);
      }

      const speakers: Speaker[] = await bot.dbManager.getEventSpeakers(eventId);
      // TODO: Change unshift to push later
      if (speakers.length > 0) {
        buttonsArray.unshift([Markup.button.callback('👨‍👩‍👧‍👦 Участники', `action_get_speakers_${eventId}`)]);
      }

      // Add link buttons if event has filled with valid fields
      if (await isValidUrl(event.tickets_link)) {
        buttonsArray.push([Markup.button.url('🎟 Билеты', event.tickets_link)]);
      }

      if (await isValidUrl(event.link)) {
        buttonsArray.push([Markup.button.url('🌐 Сайт фестиваля', event.link)]);
      }

      if (await isValidUrl(event.tg_channel)) {
        buttonsArray.push([Markup.button.url('📣 Телеграм канал фестиваля', event.tg_channel)]);
      }

      // TODO: Implement "Back to menu" button
      buttonsArray.push([Markup.button.callback('◀️ Назад', 'action_get_events'), Markup.button.callback('🔼 В главное меню', 'action_start')]);

      // Message string array
      const messageArray: String[] = [
        `<b>Локация:</b> ${event.location}`,
        `${event.description}`,
        `<b>Дата и время:</b>  ${event.datetime}`,
        `<b>Цена:</b>  ${event.currency} ${event.current_price}`,
      ];

      ctx.replyWithHTML(messageArray.join('\n\n'), Markup.inlineKeyboard(buttonsArray));
    }
  });
};

export default getEventInfo;
