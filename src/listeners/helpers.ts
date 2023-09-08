import { IBotContext, SessionMessage } from '../context/IBotContext';

export const addMessageToSession = (msg: Omit<SessionMessage, 'timestamp'>, ctx: IBotContext) => {
  const timestamp = Date.now();
  ctx.session.messages = ctx.session.messages
    ? [
      ...ctx.session.messages,
      {
        ...msg,
        timestamp,
      },
    ]
    : [
      {
        ...msg,
        timestamp,
      },
    ];
};

/**
 * Checks whether particular hours have passed from timestamp
 * @param {number} timestamp
 * @param {number} passedHours
 * @return {boolean}
 * */
export const checkPassedHours = (timestamp: number, passedHours: number) => {
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

// eslint-disable-next-line max-len
export const deletePreveiosWelcomeMessage = async (
  ctx: IBotContext,
  preveiosMessage?: SessionMessage,
) => {
  if (preveiosMessage && !checkPassedHours(preveiosMessage?.timestamp, 48)) {
    try {
      await ctx.telegram.deleteMessage(preveiosMessage.chatId, preveiosMessage.messageId);
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
export const addBackslashBeforeSpecialChars = (text: string): string => text.replace(/[^A-ZА-Я0-9]/gi, '\\$&');
