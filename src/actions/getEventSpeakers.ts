// import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../types';
// import { isValidUrl } from '../utils/isValidUrl';

const getEventSpeakers = async (bot: TelegramBot) => {
  bot.action(/action_get_speakers_/, async (ctx) => {
    const event: Event | undefined = ctx.session.selectedConf;

    if (!event) {
      // TODO: Implement logs and store this errors there
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
    } else {
      const speakersArr: Speaker[] = await bot.dbManager.getEventSpeakers(event._id!);

      // Remove keyboard from last message
      ctx.editMessageReplyMarkup(undefined);

      // Reply with all Speakers to chat
      for (const speaker of speakersArr) {
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
          Markup.button.callback('◀️ Назад', `action_get_info_${ctx.session.selectedConf!._id!.toString()}`),
          Markup.button.callback('🔼 В главное меню', 'action_start'),
        ],
      ));
    }
  });
};

export default getEventSpeakers;
