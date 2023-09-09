import { escapers } from '@telegraf/entity';
import { IBotContext, LastSentWelcomeMessage } from '../context/IBotContext';

export const addLastSentMessageToSession = (
  msg: Omit<LastSentWelcomeMessage, 'timestamp'>,
  ctx: IBotContext,
) => {
  const timestamp = Date.now();
  ctx.session.lastSentWelcomeMessage = {
    ...msg,
    timestamp,
  };
};

/**
 * Checks whether particular hours have passed from timestamp
 * @param {number} timestamp
 * @param {number} passedHours
 * @return {boolean}
 * */
export const checkPassedHours = (timestamp: number, passedHours: number): boolean => {
  const now = Date.now();
  // Calculate the time difference in milliseconds
  const timeDifference = now - timestamp;
  // Convert the time difference from milliseconds to hours
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  return hoursDifference > passedHours;
};

/**
 * Takes error and returns error message
 * @param err
 * @return {string} Error message
 * */
export const getErrorMsg = (err: unknown | Error): string => {
  if (err instanceof Error) {
    return err.message;
  }
  return JSON.stringify(err);
};

/**
 * Deletes last sent welcome message
 * @param {IBotContext} ctx
 * */
export const deleteLastSentWelcomeMessage = async (ctx: IBotContext) => {
  const lastSentWelcome = ctx.session.lastSentWelcomeMessage;
  ctx.session.lastSentWelcomeMessage = null;
  if (lastSentWelcome && !checkPassedHours(lastSentWelcome?.timestamp, 48)) {
    try {
      await ctx.telegram.deleteMessage(lastSentWelcome.chatId, lastSentWelcome.messageId);
    } catch (e) {
      console.error(
        `\nOccurred error while deleting preveios welcome message.\nError - ${getErrorMsg(e)}`,
      );
    }
  }
};

/**
 * Adds backslash before special chars
 * @example Abc_df, -> Abc\_df\,
 * @param {string} text
 * @return {string}
 * */
export const escapeTextForMarkdown2 = (text: string): string => escapers.MarkdownV2(text);
