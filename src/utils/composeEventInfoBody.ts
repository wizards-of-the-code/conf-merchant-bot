import { Event } from '../data/types/index';
import formatDateToDdMmYyyy from './dateFormat';
import parseRichText from './parseRichText';

/**
 * Composes Event Info message as string depending on the parameters presented in the Event object.
 * @param {Event} event - Event object.
 * @returns {string} Formatted string for Event Info telegram message.
 */
const composeEventInfoBody = (event: Event): string => {
  const textLines: string[] = [];

  textLines.push(`<b>Конфа:</b> ${event.name}`);

  if (event.location.city && event.location.country) {
    textLines.push(`<b>Локация:</b> ${event.location.city}, ${event.location.country}`);
  }

  if (event.description) {
    textLines.push(parseRichText(event.description));
  }

  if (event.datetime) {
    textLines.push(`<b>Дата проведения:</b> ${formatDateToDdMmYyyy(event.datetime)}`);
  }

  if (event.currency && event.current_price) {
    textLines.push(`<b>Цена:</b> ${event.currency} ${event.current_price}`);
  }

  if (event.currency && event.partner_price) {
    textLines.push(`<b>Цена для "+1":</b> ${event.currency} ${event.partner_price}`);
  }

  return textLines.join('\n\n');
};

export default composeEventInfoBody;
