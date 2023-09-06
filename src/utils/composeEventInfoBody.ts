import { Event } from '../types/index';
import formatDateToDdMmYyyy from './dateFormat';

/**
 * Composes Event Info message as string depending on the parameters presented in the Event object.
 * @param {Event} event - Event object.
 * @returns {string} Formatted string for Event Info telegram message.
 */
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
    messageArray.push(`<b>Дата проведения:</b> ${formatDateToDdMmYyyy(event.datetime)}`);
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
