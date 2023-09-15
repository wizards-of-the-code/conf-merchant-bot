import { Schema, model } from 'mongoose';

export type SentWelcomeMessageType = {
  messageId: number;
  chatId: number;
  createdAt: Date;
  updatedAt: Date;
};
export const sentWelcomeMessageSchema = new Schema<SentWelcomeMessageType>(
  {
    messageId: {
      type: Number,
      required: true,
    },
    chatId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const SentWelcomeMessage = model<SentWelcomeMessageType>(
  'Sent-welcome-message',
  sentWelcomeMessageSchema,
);

export type WelcomeMessageType = {
  message: string;
  forChat: string;
};

export const welcomeMessageSchema = new Schema<WelcomeMessageType>(
  {
    message: {
      type: String,
      required: true,
    },
    forChat: {
      type: String,
      required: true,
    },
  },
  { collection: 'welcome-messages' },
);

export const WelcomeMessage = model<WelcomeMessageType>('Welcome-message', welcomeMessageSchema);

export type FooterType = {
  message: string;
};

export const footerSchema = new Schema<FooterType>(
  {
    message: {
      required: true,
      type: String,
    },
  },
  { collection: 'footer' },
);

export const Footer = model<FooterType>('Footer', footerSchema);
