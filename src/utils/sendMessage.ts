import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { ObjectId } from 'mongodb';
import { Media, Message } from '../types';
import { IBotContext } from '../context/IBotContext';
import TelegramBot from '../TelegramBot';
import 'dotenv/config';

/**
 * Send a message with images and/or buttons from Standard Messages DB collection.
 * @param {Message} message Message to be sent.
 * @param {IBotContext} ctx Bot context.
 * @param buttons (Optional) Inline buttons array.
 */
const sendMessage = async (
  message: Message,
  ctx: IBotContext,
  bot: TelegramBot,
  buttons: (
    InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
  )[][] = [],
) => {
  // Send images if they exists
  if (message.images.length > 0) {
    const paths = message.images.map((item) => new ObjectId(item.media_id));

    // Get image paths from DB
    const media = await bot.dbManager.getCollectionData<Media>(
      'media',
      { _id: { $in: paths } },
    );

    for (const image of media) {
      // Get file right from the server's volume
      const fullPath = `${process.env.MEDIA_PATH}/${image.filename}`;
      /* eslint-disable no-await-in-loop --
          * The general idea to wait until each Context reply should be finished
          * until next one should run :)
          */
      await ctx.sendPhoto({ source: fullPath });
    }
  }

  // Send messages
  if (message.messageList.length > 0) {
    // Index for finding last message
    let index = 0;
    for (const messageItem of message.messageList) {
      if (index < message.messageList.length - 1 || buttons.length === 0) {
        /* eslint-disable no-await-in-loop --
            * The general idea to wait until each Context reply should be finished
            * until next one should run :)
            */
        await ctx.reply(messageItem);
        index += 1;
      } else {
        await ctx.reply(messageItem, Markup.inlineKeyboard(buttons));
      }
    }
  }
};

export default sendMessage;
