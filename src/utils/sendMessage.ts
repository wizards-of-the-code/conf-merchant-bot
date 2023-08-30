import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';
import { Message } from '../types';
import { IBotContext } from '../context/IBotContext';

/**
 * Send a message with images and/or buttons from Standard Messages DB collection.
 * @param {Message} message Message to be sent.
 * @param {IBotContext} ctx Bot context.
 * @param buttons (Optional) Inline buttons array.
 */
const sendMessage = async (
  message: Message,
  ctx: IBotContext,
  buttons: (
    InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
  )[][] = [],
) => {
  // Send images if they exists
  if (message.images.length > 0) {
    for (const image of message.images) {
      /* eslint-disable no-await-in-loop --
          * The general idea to wait until each Context reply should be finished
          * until next one should run :)
          */
      await ctx.sendPhoto(image);
    }
  }

  // Send messages
  if (message.value.length > 0) {
    // Index for finding last message
    let index = 0;
    for (const msg of message.value) {
      if (index < message.value.length - 1 || buttons.length === 0) {
        /* eslint-disable no-await-in-loop --
            * The general idea to wait until each Context reply should be finished
            * until next one should run :)
            */
        await ctx.reply(msg);
        index += 1;
      } else {
        await ctx.reply(msg, Markup.inlineKeyboard(buttons));
      }
    }
  }
};

export default sendMessage;
