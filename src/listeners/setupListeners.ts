import TelegramBot from '../TelegramBot';
import onNewChatMembers from './onNewChatMembers';
import onLeftChatMember from './onLeftChatMember';

/**
 * @param {TelegramBot} bot;
 */
const setupListeners = (bot: TelegramBot) => {
  onNewChatMembers(bot);
  onLeftChatMember(bot);
};

export default setupListeners;
