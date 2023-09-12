import TelegramBot from '../TelegramBot';
import onNewChatMembers from './onNewChatMembers';
import onLeftChatMember from './onLeftChatMember';
import onNewMessage from "./onNewMessage";

/**
 * @param {TelegramBot} bot;
 */
const setupListeners = (bot: TelegramBot) => {
  onNewChatMembers(bot);
  onLeftChatMember(bot);
  // onNewMessage(bot);
};

export default setupListeners;
