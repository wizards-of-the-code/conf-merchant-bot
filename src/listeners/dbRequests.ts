import DBManager from '../mongodb/DBManager';
import {
  ChatBotCollection,
  ChatBotCollections,
  CollectionEnum,
  SentWelcomeMessage,
} from './contracts';
import { IBotContext } from '../context/IBotContext';
import { checkPassedHours, getErrorMsg } from './helpers';

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
    console.error(`While updating sent messages: ${getErrorMsg(e)}`);
  }
};

/**
 * Deletes first message from queue
 * @param {IBotContext} ctx
 * @param {ChatBotCollection} sentMessages
 * */
export const deleteEarlierMessage = async (ctx: IBotContext, sentMessages: ChatBotCollection) => {
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
  const chatBotCollections = await db.getCollectionData<ChatBotCollection>(
    CollectionEnum.Welcome,
    {},
  );
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
