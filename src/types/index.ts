import { ObjectId } from 'mongodb';

export type Event = {
  _id?: ObjectId;
  name: string;
  description: string;
  tickets_link: string;
  link: string;
  datetime: string;
  current_price: string;
  currency: string;
  tg_channel: string;
  is_active: boolean;
  location: Location;
  participants: ObjectId[];
};

export type TelegramUser = {
  id: number;
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
};

export type Participant = {
  _id?: ObjectId;
  tg: TelegramUser;
  events: ParticipantEventDetails[];
};

export type ParticipantShort = {
  tg: {
    id: number;
    first_name: string;
    last_name?: string;
  }
};

export type Speaker = {
  _id?: ObjectId;
  event_id: ObjectId;
  name: string;
  position: string;
  topic: string;
  topic_description: string;
};

export type Sponsor = {
  _id?: ObjectId;
  donation: string;
  tg: TelegramUser;
};

export type ScheduleItem = {
  _id: ObjectId;
  event_id: ObjectId;
  date: string;
  time: string;
  title: string;
};

export type LogEntry = {
  _id?: ObjectId;
  datetime: Date;
  event: string;
  message?: string;
  initiator: TelegramUser;
};

export type Message = {
  _id?: ObjectId;
  name: string;
  value: string[];
};

export type ScheduledMessage = {
  _id: ObjectId;
  event_id: ObjectId;
  is_active: boolean;
  text: string;
  days_before_conf?: number;
  photos: string[];
  actions: string[];
  sent: Date | null;
  datetime_to_send: Date;
  type: 'manual' | 'auto';
  links: MessageButton[];
};

export type MessageButton = {
  name: string;
  url: string;
};
