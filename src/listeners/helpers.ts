import { IBotContext } from '../context/IBotContext';

/**
 * @param {IBotContext} ctx - Context
 * @returns {string}
 */
const tagUser = (ctx: IBotContext): string => {
  const { from } = ctx;
  if (from) {
    return from.username ? `@${from.username}` : from.first_name;
  }
  return '';
};

export default tagUser;
