import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { ObjectId } from 'mongodb';
import { Media, Message } from '../types';
import { IBotContext } from '../context/IBotContext';
import TelegramBot from '../TelegramBot';
import 'dotenv/config';
import parseRichText from './parseRichText';
import { isValidUrl } from './isValidUrl';
import getErrorMsg from './getErrorMessage';
import logger from '../logger/logger';

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
  if (message.images && message.images.length > 0) {
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
      try {
        await ctx.sendPhoto({ source: fullPath });
      } catch (e) {
        logger.error(`Error on sending photo: ${getErrorMsg(e)}`);
      }
    }
  }

  // Send messages
  if (message.messageList.length > 0) {
    // Add links if they exists
    const dbButtons: (
      InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
    )[][] = [];
    if (message.links && message.links.length > 0) {
      for (const link of message.links) {
        // Mandatory link validation - in other case bot will crash
        if (await isValidUrl(link.url)) {
          dbButtons.push([Markup.button.url(link.name, link.url)]);
        }
      }
      // Add dbButtons to parameter array
      buttons.unshift(...dbButtons);
    }

    // Index for finding last message
    let index = 0;
    for (const messageItem of message.messageList) {
      if (index < message.messageList.length - 1 || buttons.length === 0) {
        /* eslint-disable no-await-in-loop --
            * The general idea to wait until each Context reply should be finished
            * until next one should run :)
            */
        await ctx.reply(parseRichText(messageItem.text), {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        index += 1;
      } else {
        // Last message should be with buttons if they exists
        await ctx.reply(parseRichText(messageItem.text), {
          ...Markup.inlineKeyboard(buttons),
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
      }
    }
  }
};

export default sendMessage;
