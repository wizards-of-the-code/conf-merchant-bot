import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../../data/types';
import parseRichText from '../../utils/parseRichText';
import handleExpiredSession from '../../utils/handleExpiredSession';

const constructMessage = (speakers: Speaker[]) => {
  const messageLines: string[] = ['👨‍👩‍👧‍👦 Список спикеров конференции: \n'];
  speakers.forEach((speaker) => {
    if (speaker.name) {
      messageLines.push(`<b>${speaker.name}</b>`);
    }
    if (speaker.position) {
      messageLines.push(`<em>${speaker.position}</em>`);
    }
    if (speaker.topic) {
      messageLines.push(`<b>Тема доклада:</b> ${speaker.topic}`);
    }
    if (speaker.topic_description) {
      messageLines.push(parseRichText(speaker.topic_description));
    }
    messageLines.push('\n');
  });
  return messageLines.join('\n');
};

const speakers = async (bot: TelegramBot) => {
  bot.action(/speakers_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      handleExpiredSession(bot, ctx);
      return;
    }

    // Remove the keyboard from the last message
    ctx.editMessageReplyMarkup(undefined);

    const speakersMessage = constructMessage(event.speakers);
    await ctx.replyWithHTML(speakersMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    // Reply footer with menu buttons
    ctx.reply('Что делаем дальше?', Markup.inlineKeyboard([
      Markup.button.callback('◀️ Назад', `info_${event._id}`),
      Markup.button.callback('🔼 В главное меню', 'menu'),
    ]));
  });
};

export default speakers;
