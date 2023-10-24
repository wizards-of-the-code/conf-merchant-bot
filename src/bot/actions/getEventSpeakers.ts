import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../../data/types';
import parseRichText from '../../utils/parseRichText';
import handleExpiredSession from '../../utils/handleExpiredSession';

const displaySpeakerDetails = (speaker: Speaker): string => {
  const messageLines: string[] = [`<b>${speaker.name}</b>`];

  if (speaker.position) {
    messageLines.push(`<em>${speaker.position}</em>`);
  }

  messageLines.push(
    `<b>Тема доклада:</b> ${speaker.topic}`,
    parseRichText(speaker.topic_description)
  );

  return messageLines.join('\n');
};

const getEventSpeakers = async (bot: TelegramBot) => {
  bot.action(/speakers_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      handleExpiredSession(bot, ctx);
      return;
    }

    // Remove the keyboard from the last message
    ctx.editMessageReplyMarkup(undefined);

    await ctx.reply('👨‍👩‍👧‍👦 Список спикеров конференции:');

    const speakerMessages = event.speakers.map((speaker) => displaySpeakerDetails(speaker));
    for (const message of speakerMessages) {
      // eslint-disable-next-line no-await-in-loop
      await ctx.replyWithHTML(message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    }

    // Reply footer with menu buttons
    ctx.reply('Что делаем дальше?', Markup.inlineKeyboard([
      Markup.button.callback('◀️ Назад', `info_${event._id}`),
      Markup.button.callback('🔼 В главное меню', 'menu'),
    ]));
  });
};

export default getEventSpeakers;
