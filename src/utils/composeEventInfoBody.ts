import { Event } from '../types/index';

const composeEventInfoBody = (event: Event): string => {
  const messageArray: String[] = [];

  messageArray.push(`<b>Конфа:</b> ${event.name}`);

  if (event.location.city && event.location.country) {
    messageArray.push(`<b>Локация:</b> ${event.location.city}, ${event.location.country}`);
  }

  if (event.description) {
    messageArray.push(`${event.description}`);
  }

  if (event.datetime) {
    messageArray.push(`<b>Дата проведения:</b> ${event.datetime}`);
  }

  if (event.currency && event.current_price) {
    messageArray.push(`<b>Цена:</b> ${event.currency} ${event.current_price}`);
  }

  if (event.currency && event.partner_price) {
    messageArray.push(`<b>Цена для "+1":</b> ${event.currency} ${event.partner_price}`);
  }

  return messageArray.join('\n\n');
};

export default composeEventInfoBody;
