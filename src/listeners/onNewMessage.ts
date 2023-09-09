import { message } from 'telegraf/filters';
import { CollectionEnum, WelcomeMessage } from './onNewChatMembers';
import TelegramBot from '../TelegramBot';
import { escapeTextForMarkdown2, getErrorMsg } from './helpers';

/**
 * @param bot
 */
const onNewMessage = (bot: TelegramBot) => {
  bot.on(message('text'), async (ctx) => {
    try {
      const collectionFooter = await bot.dbManager.getCollectionData<WelcomeMessage>(
        CollectionEnum.Welcome,
        {
          title: 'Footer',
        },
      );

      if (!collectionFooter.length) {
        throw new Error('Footer is not found');
      }
      const footerObj = collectionFooter[0];

      const user = ctx.message.from;
      const newMemberMention = `[@${escapeTextForMarkdown2(
        user.username ?? user.first_name,
      )}](tg://user?id=${user.id})`;

      await ctx.sendMessage(`${newMemberMention} \n\n${footerObj.message}`, {
        parse_mode: 'MarkdownV2',
      });
    } catch (e) {
      console.error(getErrorMsg(e));
    }
  });
};
export default onNewMessage;
