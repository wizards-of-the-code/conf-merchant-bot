import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import Command from './Command';

// Actions imports
import getEvents, { sendEventsMessage } from '../actions/getEvents';
import subscribeToEvent from '../actions/subscribeToEvent';
// eslint-disable-next-line import/no-cycle
import getEventInfo, { sendEventInfoMessage } from '../actions/getEventInfo';
import participate from '../actions/participate';
import sponsorship from '../actions/sponsorship';
import getEventSpeakers from '../actions/getEventSpeakers';
import getEventSchedule from '../actions/getEventSchedule';
import TelegramBot from '../TelegramBot';
import { IBotContext } from '../context/BotContext.interface';
<<<<<<< HEAD
import { messages } from '../constants';
import participantRole from '../actions/role';
import organizerRole from '../actions/organizer';
import volunteerRole from '../actions/volunteer';
=======
import participantRole from '../actions/role';
import organizerRole from '../actions/organizer';
import volunteerRole from '../actions/volunteer';

// TODO: Store these messages in DB in the future
const startMessages = [
  `Peredelanoconf — это проект, который мы делаем, чтобы объединять и поддерживать экспатов по всему миру. Хорошая конференция базируется на трёх китах: индустриальная польза, приятное времяпрепровождение и сообщество.
Мы — в первую очередь про сообщество. Мы существуем для того, чтобы у вас на новом месте появились знакомые, друзья и коллеги. Чтобы никто не был один. Наши конфы проходят в формате уютной домашней вечеринки, специально для того, чтобы людям было проще сойтись и подружиться, а также послушать классные доклады от не менее крутых спикеров. После самого мероприятия сообщество продолжает жить в чате, и в бесчисленных ламповых встречах в барах, коворкингах, кафешках, где угодно!`,
  `Но! Индустриальная польза тоже будет, у нас есть спикеры — разговоры на технические темы приветствуются, старый добрый формат обсуждения принципов работы гарбадж коллектора в курилке — это то, что вы найдете у нас.
Приходите, мы вас тепло встретим и угостим приветственным напитком, после покажем-расскажем все, дадим еду и напитки, а вечером торжественное открытие и доклады. При этом развлечения есть на любой вкус – для фанатов настолок, меломанов и любителей посидеть тихонечко в уголке пообщаться о высокодуховном.`,
];
>>>>>>> 4e77ba612c8092ae125f057bc4f85c1efbbb31ed

export const sendStartMessage = async (bot: TelegramBot, ctx: IBotContext) => {
  // Get messages array from DB
  const startMessages = await bot.dbManager.getMessagesArray(messages.START_MESSAGES);

  // Send start messages
  for (const msg of startMessages) {
    /* eslint-disable no-await-in-loop --
        * The general idea to wait until each Context reply should be finished
        * until next one should run :)
        */
    await ctx.reply(msg);
  }

  const buttonsArray: (
    InlineKeyboardButton.UrlButton | InlineKeyboardButton.CallbackButton
  )[][] = [
      [Markup.button.url('Telegram', 'https://t.me/peredelanoconfchannel')],
      [Markup.button.url('Instagram', 'https://www.instagram.com/peredelanoconf')],
      [Markup.button.url('Discord', 'https://discord.com/channels/1109396222604738612/1109397021271539783')],
      [Markup.button.url('Github', 'https://github.com/philippranzhin/peredelanoconf')],
      [Markup.button.url('Twitter', 'https://twitter.com/peredelano_conf')],
      [Markup.button.url('Facebook', 'https://www.facebook.com/peredelanoconf')],
      [Markup.button.url('Официальный сайт', 'https://peredelanoconf.com/')],
      [Markup.button.callback('🌟 Стать спонсором', 'action_become_sponsor')]
    ];

  await ctx.reply(
    'Наши социальные сети:',
    Markup.inlineKeyboard([
      ...buttonsArray,
    ]),
  );

  setTimeout(() => sendEventsMessage(bot, ctx), 2000);
};

class StartCommand extends Command {
  handle(): void {
    this.bot.start(async (ctx) => {
      // Save user id to session
      ctx.session.userId = ctx.from?.id;

      // Check for startPayload - parameter to link bot to a certain event (for marketing purposes)
      if (ctx.startPayload) {
        // Call certain event action
        sendEventInfoMessage(this.bot, ctx, ctx.startPayload);
      } else {
        console.log('No payload, starting standard sequence.');

        sendStartMessage(this.bot, ctx);
      }
    });

    // ACTION HANDLERS

    // Action: Get all events
    getEvents(this.bot);

    // Action: Subscribe to selected event ** WIP**
    subscribeToEvent(this.bot);

    // Action: Get event by name, saved in Session
    getEventInfo(this.bot);

    participantRole(this.bot);
    organizerRole(this.bot);
    volunteerRole(this.bot);
    sponsorship(this.bot);

    // Action: Participate in selected event
    participate(this.bot);


    // Action: Show speakers for a selected event
    getEventSpeakers(this.bot);

    // Action: Show schedule for a selected event
    getEventSchedule(this.bot);

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export default StartCommand;
