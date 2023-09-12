import { ObjectId } from 'mongodb';

export enum CollectionEnum {
  Welcome = 'message-for-new-members',
}

export type SentWelcomeMessage = { messageId: number; chatId: number; timestamp: number };
export type WelcomeMessage = { message: string; title?: string; _id: ObjectId; forChat?: string };
export type ChatBotCollection = {
  title?: string;
  forChat?: string;
  message?: string;
  messages?: SentWelcomeMessage[];
  _id: ObjectId;
};
export type ChatBotCollections = {
  welcomeMessage: string;
  footer: string;
  sentMessages: ChatBotCollection;
};
