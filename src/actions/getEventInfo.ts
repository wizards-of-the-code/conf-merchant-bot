import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import TelegramBot from '../TelegramBot';
import { Event } from '../types';
import { isValidUrl } from '../utils/isValidUrl';

const getEventInfo = async (bot: TelegramBot) => {
  bot.action(/action_get_info_/, async (ctx) => {
    const actionString = ctx.match.input;

    // Get action id from context
    const name = actionString.slice(actionString.lastIndexOf('_') + 1);

    const event: Event | null = await bot.dbManager.getEventByName(name);

    if (!event) {
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    } else {
      // Save event to current session context
      ctx.session.selectedConf = event;

      ctx.deleteMessage();

      const buttonsArray: (
        InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
      )[][] = [
        // [Markup.button.callback('🗺 Карта фестиваля', 'action_event_map')],
        [Markup.button.callback('👨‍👩‍👧‍👦 Участники', 'action_speakers')],
        [Markup.button.callback('🗓 Расписание', 'action_schedule')],
        // [Markup.button.callback('💼 Craft Business', 'action_craft_business')],
        // [Markup.button.callback('🙋‍♂️ Голосование', 'action_poll')],
        // [Markup.button.callback('🧩 Вопросы и ответы', 'action_qna')],
        [Markup.button.callback('🎟 Билеты', 'action_tickets')],
        [Markup.button.callback('📝 Записаться', 'action_participate')],
      ];

      // Add link buttons if event has filled with valid fields
      if (await isValidUrl(event.link)) {
        buttonsArray.push([Markup.button.url('🌐 Сайт фестиваля', event.link)]);
      }

      if (await isValidUrl(event.tg_channel)) {
        buttonsArray.push([Markup.button.url('📣 Телеграм канал фестиваля', event.tg_channel)]);
      }

      buttonsArray.push([Markup.button.callback('◀️ Назад', 'action_get_events'), Markup.button.callback('🔼 В главное меню', 'action_start')]);

      ctx.reply(`
          Локация: ${event.location}\n\n${event.description}\n\nДата и время: ${event.datetime}\n\nЦена: ${event.currency} ${event.current_price}
        `, Markup.inlineKeyboard(buttonsArray));
    }
  });
};

export default getEventInfo;
