import { Markup } from 'telegraf';
// eslint-disable-next-line import/no-cycle
import TelegramBot, { BotContext } from '../TelegramBot';

interface PaginatorOptions<T> {
  items: T[];
  itemsPerPage: number;
  currentPage: number;
  increment: number;
  itemToString: (item: any) => string;
  linkItem: (item: any) => string;
}

class Paginator<T> {
  bot: TelegramBot;

  private message: string;

  private lastPage: number;

  private readonly options: PaginatorOptions<T>;

  constructor(bot: TelegramBot, message: string, options: PaginatorOptions<T>) {
    this.bot = bot;
    this.options = options;
    this.message = message;
    this.lastPage = Math.ceil(this.options.items.length / this.options.itemsPerPage) - 1;
  }

  private getPageItems(): T[] {
    const startIdx = this.options.currentPage * this.options.itemsPerPage;
    return this.options.items.slice(startIdx, startIdx + this.options.itemsPerPage);
  }

  private createButtons() {
    const buttons = this.getPageItems().map((item) => [
      Markup.button.callback(this.options.itemToString(item), this.options.linkItem(item)),
    ]);
    return buttons;
  }

  async sendPage(ctx: BotContext): Promise<void> {
    const buttons = this.createButtons();
    const paginationButtons = [];
    if (this.options.items.length <= this.options.itemsPerPage) {
      ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      return;
    }

    if (this.options.currentPage !== 0) {
      paginationButtons.push(
        Markup.button.callback('« Назад', 'prev_page'),
      );
    }

    if (this.options.currentPage !== this.lastPage) {
      paginationButtons.push(
        Markup.button.callback('Вперед »', 'next_page'),
      );
    }

    buttons.push(paginationButtons);

    if (ctx.session.currentMessage === -1) {
      const message = await ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      ctx.session.currentMessage = message.message_id;
    } else {
      ctx.telegram.editMessageText(
        ctx.session.userId,
        ctx.session.currentMessage,
        undefined,
        this.message,
        Markup.inlineKeyboard(buttons),
      );
    }
  }

  handlePage(ctx: BotContext): void {
    if (this.options.increment < 0) {
      this.options.currentPage = Math.max(0, this.options.currentPage + this.options.increment);
    } else if (this.options.increment > 0) {
      this.options.currentPage = Math.min(
        this.lastPage,
        this.options.currentPage + this.options.increment,
      );
    }

    ctx.session.currentPage = this.options.currentPage;
    this.sendPage(ctx);
  }
}

export default Paginator;
