import { Markup } from 'telegraf';
// eslint-disable-next-line import/no-cycle
import { IBotContext } from '../context/IBotContext';

interface PaginatorOptions<T> {
  items: T[];
  itemsPerPage: number;
  itemToString: (item: any) => string;
  linkItem: (item: any) => string;
}

class Paginator<T> {
  private currentPage: number = 0;

  private messageId: number | undefined = -1;

  private message: string;

  private lastPage: number;

  private readonly options: PaginatorOptions<T>;

  constructor(message: string, options: PaginatorOptions<T>) {
    this.options = options;
    this.message = message;
    this.lastPage = Math.ceil(this.options.items.length / this.options.itemsPerPage) - 1;
  }

  private getPageItems(): T[] {
    const startIdx = this.currentPage * this.options.itemsPerPage;
    return this.options.items.slice(startIdx, startIdx + this.options.itemsPerPage);
  }

  private createButtons() {
    const buttons = this.getPageItems().map((item) => [
      Markup.button.callback(this.options.itemToString(item), this.options.linkItem(item)),
    ]);
    return buttons;
  }

  async sendPage(ctx: IBotContext): Promise<void> {
    const buttons = this.createButtons();
    const paginationButtons = [];
    if (this.options.items.length <= this.options.itemsPerPage) {
      ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      return;
    }

    if (this.currentPage !== 0) {
      paginationButtons.push(
        Markup.button.callback('« Назад', `prev_page_${ctx.session.userId}`),
      );
    }

    if (this.currentPage !== this.lastPage) {
      paginationButtons.push(
        Markup.button.callback('Вперед »', `next_page_${ctx.session.userId}`),
      );
    }

    buttons.push(paginationButtons);

    if (this.messageId === -1) {
      const message = await ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      ctx.session.currentMessage = message.message_id;
      this.messageId = message.message_id;
    } else {
      ctx.telegram.editMessageText(
        ctx.chat?.id,
        ctx.session.currentMessage,
        undefined,
        this.message,
        Markup.inlineKeyboard(buttons),
      );
    }
  }

  handlePreviousPage(ctx: IBotContext): void {
    console.log('currentPage', this.currentPage);
    console.log('lastPage', this.lastPage);
    this.currentPage = Math.max(0, this.currentPage - 1);
    this.sendPage(ctx);
  }

  handleNextPage(ctx: IBotContext): void {
    console.log('currentPage', this.currentPage);
    console.log('lastPage', this.lastPage);
    this.currentPage = Math.min(this.lastPage, this.currentPage + 1);
    this.sendPage(ctx);
  }
}

export default Paginator;
