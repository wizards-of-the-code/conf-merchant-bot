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
  email?: string;
  tg: TelegramUser;
  events: ParticipantEventDetails[];
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
  email: string;
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
  initiator: TelegramUser;
  event: string;
  message: string;
};

export type Message = {
  _id?: ObjectId;
  name: string;
  value: string[];
};
