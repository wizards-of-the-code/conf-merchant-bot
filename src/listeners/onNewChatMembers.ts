import { message } from 'telegraf/filters';
import { ObjectId } from 'mongodb';
import TelegramBot from '../TelegramBot';
import tagUser from './helpers';

export enum WelcomeMessageEnum {
  Common = 'For new members',
  CommonWithLink = 'For new members with link',
}

export type WelcomeMessage = { message: string, title: string, _id: ObjectId, link?: string };

/**
 * @param {TelegramBot} bot;
 */
const onNewChatMembers = (bot: TelegramBot) => {
  bot.on(message('new_chat_members'), (ctx) => {
    (async () => {
      try {
        const collection = await bot.dbManager.getCollectionData<WelcomeMessage>('message-for-new-members', { title: WelcomeMessageEnum.CommonWithLink });
        if (!collection.length) {
          throw new Error('Collection of message for new user is empty');
        }
        const msgObj = collection[0];

        if (!msgObj.link) {
          ctx.reply(`${tagUser(ctx)}, ${msgObj.message}`);
        } else {
          await ctx.replyWithHTML(`${tagUser(ctx)}, <a href="${msgObj.link}">${msgObj.message}</a>`);
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    })();
  });
};

export default onNewChatMembers;
