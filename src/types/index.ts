import { ObjectId } from 'mongodb';

export type Event = {
  _id?: ObjectId;
  name: string;
  location: string;
  description: string;
  tickets_link: string;
  link: string;
  datetime: string;
  address: string;
  current_price: string;
  currency: string;
  tg_channel: string;
  is_active: boolean;
};

export type Participant = {
  _id?: ObjectId;
  tg_id: number;
  event_id: ObjectId;
  tg_first_name: string;
  tg_last_name?: string;
  email: string;
  type: string;
};

export type Speaker = {
  _id?: ObjectId;
  name: string;
  event_id: ObjectId;
  position: string;
  topic: string;
  topic_description: string;
};

export type Sponsor = {
  _id?: ObjectId;
  tg_id: number;
  tg_first_name: string;
  tg_last_name?: string;
  email: string;
  donation: string;
}

export type ScheduleItem = {
  _id: ObjectId;
  event_id: ObjectId;
  date: string;
  time: string;
  title: string;
};
