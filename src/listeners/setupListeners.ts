import TelegramBot from '../TelegramBot';
import onNewChatMembers from './onNewChatMembers';

/**
 * @param {TelegramBot} bot;
 */

const setupListeners = (bot: TelegramBot) => {
  onNewChatMembers(bot);
};

export default setupListeners;
