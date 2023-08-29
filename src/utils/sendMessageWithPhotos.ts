import { Message } from '../types';
import { IBotContext } from '../context/IBotContext';

/**
 * Send a message with images from Standard Messages DB collection.
 * @param {Message} message Message to be sent.
 * @param {IBotContext} ctx Bot context.
 */
const sendMessageWithPhotos = async (message: Message, ctx: IBotContext) => {
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
    for (const msg of message.value) {
      /* eslint-disable no-await-in-loop --
          * The general idea to wait until each Context reply should be finished
          * until next one should run :)
          */
      await ctx.reply(msg);
    }
  }
};

export default sendMessageWithPhotos;
