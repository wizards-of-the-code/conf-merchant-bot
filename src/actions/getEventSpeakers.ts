import { Markup } from 'telegraf';
import TelegramBot from '../TelegramBot';
import { Event, Speaker } from '../types';

const displaySpeakerDetails = async (ctx: any, speaker: Speaker) => {
  const messageArray: string[] = [
    `<b>${speaker.name}</b>`,
    `<em>${speaker.position}</em>\n`,
    `<b>Тема доклада:</b> ${speaker.topic}\n`,
    `${speaker.topic_description}`,
  ];

  await ctx.replyWithHTML(
    messageArray.join('\n'),
    {
      parse_mode: 'HTML',
    },
  );
};

const getEventSpeakers = async (bot: TelegramBot) => {
  bot.action(/action_get_speakers_/, async (ctx) => {
    const event: Event | null = ctx.session.selectedEvent;

    if (!event) {
      console.log(`[${new Date().toLocaleTimeString('ru-RU')}]: Error: No event found`);
      return;
    }

    const speakers = await bot.dbManager.getCollectionData<Speaker>('speakers', { event_id: event._id });

    // Remove keyboard from the last message
    ctx.editMessageReplyMarkup(undefined);

    for (const speaker of speakers) {
      displaySpeakerDetails(ctx, speaker);
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
