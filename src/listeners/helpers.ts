import { escapers } from '@telegraf/entity';
import { IBotContext } from '../context/IBotContext';
import { CollectionEnum, LastSentWelcomeMessage, WelcomeMessage } from './contracts';
import DBManager from '../mongodb/DBManager';

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
 * Updates last sent welcome message
 * @param {Omit<LastSentWelcomeMessage, 'timestamp'>} message
 * @param {DBManager} db
 * */
export const updateLastSentWelcomeMessage = async (
  message: Omit<LastSentWelcomeMessage, 'timestamp'>,
  db: DBManager,
) => {
  await db.insertOrUpdateDocumentToCollection(
    CollectionEnum.Welcome,
    { title: 'Last sent welcome message' },
    {
      $set: {
        ...message,
        timestamp: Date.now(),
      },
    },
  );
};

/**
 * Deletes last sent welcome message
 * @param {IBotContext} ctx
 * @param {DBManager} db
 * */
export const deleteLastSentWelcomeMessage = async (ctx: IBotContext, db: DBManager) => {
  const lastSentWelcomeMessageObj = await db.getCollectionData<LastSentWelcomeMessage>(
    CollectionEnum.Welcome,
    {
      title: 'Last sent welcome message',
    },
  );
  const lastSentWelcome = lastSentWelcomeMessageObj[0];
  if (lastSentWelcome && !checkPassedHours(lastSentWelcome?.timestamp, 48)) {
    await ctx.telegram.deleteMessage(lastSentWelcome.chatId, lastSentWelcome.messageId);
  }
};

/**
 * Gets welcome message for chat and footer
 * @param {DBManager} db
 * @param {string} chatTitle
 * @return {Promise<{ welcomeMessage: WelcomeMessage, footer: WelcomeMessage}>}
 * */
export const getMessageAndFooterForChat = async (
  db: DBManager,
  chatTitle: string,
): Promise<{ welcomeMessage: WelcomeMessage; footer: WelcomeMessage }> => {
  const collectionMessage = await db.getCollectionData<WelcomeMessage>(CollectionEnum.Welcome, {
    forChat: chatTitle,
  });
  const collectionFooter = await db.getCollectionData<WelcomeMessage>(CollectionEnum.Welcome, {
    title: 'Footer',
  });
  if (!collectionFooter.length || !collectionMessage.length) {
    throw new Error('Welcome message or Footer is not found');
  }
  const msgObj = collectionMessage[0];
  const footerObj = collectionFooter[0];
  return {
    welcomeMessage: msgObj,
    footer: footerObj,
  };
};

/**
 * Adds backslash before special chars
 * @example Abc_df, -> Abc\_df\,
 * @param {string} text
 * @return {string}
 * */
export const escapeTextForMarkdown2 = (text: string): string => escapers.MarkdownV2(text);
