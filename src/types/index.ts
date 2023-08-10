export type Event = {
  _id: number;
  name: string;
  location: string;
  description: string;
  link: string;
  datetime: string;
  address: string;
  current_price: string;
  currency: string;
  tg_channel: string;
};

export type Participant = {
  _id?: number;
  tg_id: number;
  event_name: string;
  tg_first_name: string;
  tg_last_name?: string;
  email: string;
};
