// import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../types';
// import { isValidUrl } from '../utils/isValidUrl';

const getEventSpeakers = async (bot: TelegramBot) => {
  bot.action(/action_get_speakers_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      // TODO: Implement logs and store this errors there
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    } else {
      const speakers: Speaker[] = await bot.dbManager.getCollectionData('speakers', { event_id: event._id });
      // Remove keyboard from last message
      ctx.editMessageReplyMarkup(undefined);

      // Reply with all Speakers to chat
      for (const speaker of speakers) {
        // Message string array
        const messageArray: String[] = [
          `<b>${speaker.name}</b>`,
          `<em>${speaker.position}</em>\n`,
          `<b>Тема доклада:</b> ${speaker.topic}\n`,
          `${speaker.topic_description}`,
        ];

        /* eslint-disable no-await-in-loop --
        * The general idea to wait until each Context reply should be finished
        * until next one should run :)
        */
        await ctx.replyWithHTML(
          messageArray.join('\n'),
          {
            parse_mode: 'HTML',
          },
        );
      }

      // Reply footer with menu buttons
      ctx.reply('Что делаем дальше?', Markup.inlineKeyboard(
        [
          Markup.button.callback('◀️ Назад', `action_get_info_${event._id}`),
          Markup.button.callback('🔼 В главное меню', 'action_get_events'),
        ],
      ));
    }
  });
};

export default getEventSpeakers;
