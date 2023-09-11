import { ObjectId } from 'mongodb';

export type Event = {
  _id?: ObjectId;
  name: string;
  description: unknown[];
  tickets_link: string;
  link: string;
  datetime: Date;
  current_price: string;
  partner_price: string;
  currency: string;
  tg_channel: string;
  is_active: boolean;
  location: Location;
  participants: ObjectId[];
  schedule: ScheduleItem[];
  speakers: Speaker[];
};

export type TelegramUser = {
  tg_id: number;
  username: string;
  first_name: string;
  last_name?: string;
};

export type EventWithParticipants = {
  _id: ObjectId;
  name: string;
  location: Location;
  description: string;
  tickets_link: string;
  link: string;
  datetime: string;
  current_price: string;
  currency: string;
  tg_channel: string;
  is_active: boolean;
  participants: ParticipantShort[];
};

export type Location = {
  country: string;
  city: string;
  address: string;
  pictures: string[];
};

export type ParticipantEventDetails = {
  event_id: ObjectId;
  is_payed: boolean;
  role: string;
  attended: boolean;
};

export type Participant = {
  _id?: ObjectId;
  tg: TelegramUser;
  events: ParticipantEventDetails[];
};

export type ParticipantShort = {
  tg: {
    tg_id: number;
    first_name: string;
    last_name?: string;
  }
};

export type Speaker = {
  name: string;
  position: string;
  topic: string;
  topic_description: unknown[];
};

export type Sponsor = {
  _id?: ObjectId;
  donation: string;
  tg: TelegramUser;
};

export type ScheduleItem = {
  date: Date;
  title: string;
};

export type LogEntry = {
  _id?: ObjectId;
  event: ObjectId | undefined;
  datetime: Date;
  message?: string;
  status?: string;
  initiator: TelegramUser;
};

export type Message = {
  _id?: ObjectId;
  name: string;
  messageList: {
    text: string;
  }[];
  images: {
    media_id: string;
  }[];
};

export type Notification = {
  _id: ObjectId;
  title: string;
  is_active: boolean;
  event_id: ObjectId;
  type: 'manual' | 'auto';
  text: unknown[];
  links: MessageButton[];
  images_on_top: boolean;
  images: {
    media_id: string;
  }[];
  sent: Date | null;
  datetime_to_send: Date;
  days_before_conf?: number;
};

export type MessageButton = {
  name: string;
  url: string;
};

export type Media = {
  filename: string;
};
