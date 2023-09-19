import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../types';
import parseRichText from '../utils/parseRichText';
import handleExpiredSession from '../utils/handleExpiredSession';

const displaySpeakerDetails = async (ctx: any, speaker: Speaker) => {
  const messageLines: string[] = [
    `<b>${speaker.name}</b>`,
  ];

  // Position is only non-required field for Speaker
  messageLines.push((speaker.position) ? `<em>${speaker.position}</em>\n` : '');

  messageLines.push(
    `<b>Тема доклада:</b> ${speaker.topic}\n`,
    parseRichText(speaker.topic_description),
  );

  await ctx.replyWithHTML(
    messageLines.join('\n'),
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
  );
};

const getEventSpeakers = async (bot: TelegramBot) => {
  bot.action(/action_get_speakers_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      handleExpiredSession(bot, ctx);
      return;
    }

    // Remove keyboard from the last message
    ctx.editMessageReplyMarkup(undefined);

    await ctx.reply('👨‍👩‍👧‍👦 Список спикеров конференции:');

    for (const speaker of event.speakers) {
      /* eslint-disable no-await-in-loop */
      await displaySpeakerDetails(ctx, speaker);
    }

    // Reply footer with menu buttons
    ctx.reply('Что делаем дальше?', Markup.inlineKeyboard(
      [
        Markup.button.callback('◀️ Назад', `action_get_info_${event._id}`),
        Markup.button.callback('🔼 В главное меню', 'action_get_events'),
      ],
    ));
  });
};

export default getEventSpeakers;
