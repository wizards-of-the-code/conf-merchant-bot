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

  constructor(message: string, options: PaginatorOptions<T>) {
    this.options = options;
    this.currentPage = 0;
    this.message = message;
  }

  private getPageItems(): T[] {
    const startIdx = this.currentPage * this.options.itemsPerPage;
    return this.options.items.slice(startIdx, startIdx + this.options.itemsPerPage);
  }

  private createButtons() {
    const buttons = this.getPageItems().map((item) => [Markup.button.callback(this.options.itemToString(item), `action_get_info_${this.options.linkItem(item)}`)]);
    return buttons;
  }

  sendPage(ctx: Context): void {
    const buttons = this.createButtons();

    buttons.push([
      Markup.button.callback('⬅️ Previous', 'prev_page'),
      Markup.button.callback('Next ➡️', 'next_page'),
    ]);

    ctx.reply(this.message, Markup.inlineKeyboard(buttons));
  }
}

export default Paginator;
