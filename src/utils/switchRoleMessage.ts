import { messages } from '../constants';

/**
 * Switch role message constant depending on role passed to the function.
 * @param {string} role Role to switch
 * @returns {string | null} Constant value `string` for Role Message from DB
 * or `null` if there is no value.
 */
const switchRoleMessage = (role: string) => {
  switch (role) {
    case ('volunteer'):
      return messages.VOLUNTEER_MESSAGES;
    case ('organizer'):
      return messages.ORGANIZER_MESSAGES;
    case ('speaker'):
      return messages.SPEAKER_MESSAGES;
    default:
      return null;
  }
};

export default switchRoleMessage;
