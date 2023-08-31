import { Markup, Context } from 'telegraf';

interface PaginatorOptions<T> {
  items: T[];
  itemsPerPage: number;
  itemToString: (item: any) => string;
  linkItem: (item: any) => string;
}

class Paginator<T> {
  private currentPage: number;

  private readonly options: PaginatorOptions<T>;

  private message: string;

  private messageId: number | undefined;

  constructor(message: string, options: PaginatorOptions<T>) {
    this.options = options;
    this.currentPage = 0;
    this.message = message;
    this.messageId = -1;
  }

  private getPageItems(): T[] {
    const startIdx = this.currentPage * this.options.itemsPerPage;
    return this.options.items.slice(startIdx, startIdx + this.options.itemsPerPage);
  }

  private createButtons() {
    const buttons = this.getPageItems().map((item) => [Markup.button.callback(this.options.itemToString(item), `action_get_info_${this.options.linkItem(item)}`)]);
    return buttons;
  }

  async sendPage(ctx: Context): Promise<void> {
    const buttons = this.createButtons();
    const paginationButtons = [];
    if (this.options.items.length <= this.options.itemsPerPage) {
      ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      return;
    }

    if (this.currentPage !== 0) {
      paginationButtons.push(
        Markup.button.callback('⬅️ Назад', 'prev_page'),
      );
    }

    if (this.currentPage !== Math.ceil(this.options.items.length / this.options.itemsPerPage) - 1) {
      paginationButtons.push(
        Markup.button.callback('Вперед ➡️', 'next_page'),
      );
    }

    buttons.push(paginationButtons);
    if (this.messageId !== -1) {
      ctx.telegram.editMessageText(
        ctx.chat?.id,
        this.messageId,
        undefined,
        this.message,
        Markup.inlineKeyboard(buttons),
      );
    } else {
      const message = await ctx.reply(this.message, Markup.inlineKeyboard(buttons));
      this.messageId = message.message_id;
    }
  }

  handlePreviousPage(ctx: Context): void {
    this.currentPage = Math.max(0, this.currentPage - 1);
    this.sendPage(ctx);
  }

  handleNextPage(ctx: Context): void {
    this.currentPage = Math.min(
      Math.ceil(this.options.items.length / this.options.itemsPerPage) - 1,
      this.currentPage + 1,
    );

    this.sendPage(ctx);
  }
}

export default Paginator;
