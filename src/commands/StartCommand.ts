// import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import Command from './Command';

// Actions imports
import getEvents, { sendEventsMessage } from '../actions/getEvents';
import subscribeToEvent from '../actions/subscribeToEvent';
import getEventInfo from '../actions/getEventInfo';
import participate from '../actions/participate';
import getEventSpeakers from '../actions/getEventSpeakers';
import getEventSchedule from '../actions/getEventSchedule';

// TODO: Store these messages in DB in the future
const startMessages = [
  `Peredelanoconf — это проект, который мы делаем, чтобы объединять и поддерживать экспатов по всему миру. Хорошая конференция базируется на трёх китах: индустриальная польза, приятное времяпрепровождение и сообщество.
Мы — в первую очередь про сообщество. Мы существуем для того, чтобы у вас на новом месте появились знакомые, друзья и коллеги. Чтобы никто не был один. Наши конфы проходят в формате уютной домашней вечеринки, специально для того, чтобы людям было проще сойтись и подружиться, а также послушать классные доклады от не менее крутых спикеров. После самого мероприятия сообщество продолжает жить в чате, и в бесчисленных ламповых встречах в барах, коворкингах, кафешках, где угодно!`,
  `Но! Индустриальная польза тоже будет, у нас есть спикеры — разговоры на технические темы приветствуются, старый добрый формат обсуждения принципов работы гарбадж коллектора в курилке — это то, что вы найдете у нас.
Приходите, мы вас тепло встретим и угостим приветственным напитком, после покажем-расскажем все, дадим еду и напитки, а вечером торжественное открытие и доклады. При этом развлечения есть на любой вкус – для фанатов настолок, меломанов и любителей посидеть тихонечко в уголке пообщаться о высокодуховном.`,
];

class StartCommand extends Command {
  handle(): void {
    this.bot.start(async (ctx) => {
      // Save user id to session
      ctx.session.userId = ctx.from?.id;

      await ctx.reply(startMessages[0]);
      await ctx.reply(startMessages[1]);

      const buttonsArray: InlineKeyboardButton.UrlButton[][] = [
        [Markup.button.url('Telegram', 'https://t.me/peredelanoconfchannel')],
        [Markup.button.url('Instagram', 'https://www.instagram.com/peredelanoconf')],
        [Markup.button.url('Discord', 'https://peredelanoconf.com/')],
        [Markup.button.url('Github', 'https://github.com/philippranzhin/peredelanoconf')],
        [Markup.button.url('Twitter', 'https://twitter.com/peredelano_conf')],
        [Markup.button.url('Facebook', 'https://www.facebook.com/peredelanoconf')],
        [Markup.button.url('Официальный сайт', 'https://peredelanoconf.com/')],
      ];

      await ctx.reply(
        'Наши социальные сети:',
        Markup.inlineKeyboard([
          ...buttonsArray,
        ]),
      );

      setTimeout(() => sendEventsMessage(this.bot, ctx), 2000);
    });

    // ACTION HANDLERS

    // Action: Get all events
    getEvents(this.bot);

    // Action: Subscribe to selected event ** WIP**
    subscribeToEvent(this.bot);

    // Action: Get event by name, saved in Session
    getEventInfo(this.bot);

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
