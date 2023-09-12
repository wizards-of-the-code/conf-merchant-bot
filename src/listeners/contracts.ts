import { ObjectId } from 'mongodb';

export enum CollectionEnum {
  Welcome = 'message-for-new-members',
}
export type LastSentWelcomeMessage = { messageId: number; chatId: number; timestamp: number };
export type WelcomeMessage = { message: string; title?: string; _id: ObjectId; forChat?: string };
