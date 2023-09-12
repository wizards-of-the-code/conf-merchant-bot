import { escapers } from '@telegraf/entity';
import { IBotContext } from '../context/IBotContext';
import {
  ChatBotCollection,
  ChatBotCollections,
  CollectionEnum,
  SentWelcomeMessage,
} from './contracts';
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
 * Updates sent messages collecntion
 * @param {DBManager} db
 * @param {SentWelcomeMessage[]} sentMessage
 * @param {ChatBotCollection} sentMessages
 * */
export const updateSentMessages = async (
  db: DBManager,
  sentMessage: SentWelcomeMessage,
  sentMessages: ChatBotCollection,
) => {
  try {
    const messages = sentMessages.messages
      ? [...sentMessages.messages, sentMessage]
      : [sentMessage];

    await db.insertOrUpdateDocumentToCollection(
      CollectionEnum.Welcome,
      { title: 'Sent welcome messages' },
      {
        $set: {
          ...sentMessages,
          messages,
        },
      },
    );
  } catch (e) {
    console.error(`While update welcome message: ${getErrorMsg(e)}`);
  }
};

/**
 * Deletes first message from queue
 * @param {IBotContext} ctx
 * @param {ChatBotCollection} sentMessages
 * */
export const deleteMessageFromQueue = async (
  ctx: IBotContext,
  sentMessages: ChatBotCollection,
) => {
  try {
    if (sentMessages.messages?.length) {
      const firstFromQueue = sentMessages.messages.shift();
      if (firstFromQueue && !checkPassedHours(firstFromQueue?.timestamp, 48)) {
        await ctx.telegram.deleteMessage(firstFromQueue?.chatId, firstFromQueue?.messageId);
      }
    }
  } catch (e) {
    console.error(`While deleting welcome message: ${getErrorMsg(e)}`);
  }
};

/**
 * Gets chatbot collections
 * @param {DBManager} db
 * @param {string} chatTitle
 * @return {Promise<ChatBotCollections>}
 * */
export const getChatBotCollections = async (
  db: DBManager,
  chatTitle: string,
): Promise<ChatBotCollections> => {
  const chatBotCollections = await db.getCollection<ChatBotCollection>(CollectionEnum.Welcome);
  const welcomeMessage = chatBotCollections.find((collection) => collection?.forChat === chatTitle)
    ?.message;
  const footer = chatBotCollections.find((collection) => collection?.title === 'Footer')?.message;
  const sentMessages = chatBotCollections.find(
    (collection) => collection?.title === 'Sent welcome messages',
  );

  if (!welcomeMessage || !footer || !sentMessages) {
    throw new Error('While getting collections for chat bot');
  }

  return {
    welcomeMessage,
    footer,
    sentMessages,
  };
};

/**
 * Adds backslash before special chars
 * @example Abc_df, -> Abc\_df\,
 * @param {string} text
 * @return {string}
 * */
export const escapeTextForMarkdown2 = (text: string): string => escapers.MarkdownV2(text);
