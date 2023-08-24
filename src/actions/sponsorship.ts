import { Markup } from 'telegraf';
import { Sponsor } from "../types";
import TelegramBot from "../TelegramBot";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

const sponsorship = async (bot: TelegramBot) => {
    bot.action('action_become_sponsor', async (ctx) => {
        if (ctx.from) {
            const sponsor: Sponsor = {
                tg_id: ctx.from?.id,
                tg_first_name: ctx.from?.first_name,
                tg_last_name: ctx.from?.last_name,
                email: '',
                donation: '',
            }
            const result: boolean = await bot.dbManager.addSponsor(sponsor);

            const buttonsArray: (
                InlineKeyboardButton.CallbackButton | InlineKeyboardButton.UrlButton
            )[][] = [];
            const message: Array<string> = [];

            if (result) {
                ctx.editMessageReplyMarkup(undefined);
                buttonsArray.push( [Markup.button.url('Заполнить анкету спонсора', 'https://peredelanoconf.com/')] )
                message.push('Спасибо за Вашу поддержку!')
            } else {
                message.push('Вы снова наш спонсор, спасибо Вам!')
            }

            buttonsArray.push(
                [Markup.button.callback('Узнать больше', `more_info`)],
                [Markup.button.callback('Спонсорский пакет', `sponsorship_pack`)],
                [Markup.button.callback('Обсудить вопросы', `discussion`)],
                [Markup.button.callback('🔼 В главное меню', 'action_get_events')]
            )

            ctx.replyWithHTML(message.join('\n\n'), Markup.inlineKeyboard(buttonsArray));
        } else {
            throw new Error('Internal bot error.');
        }
    });
}

export default sponsorship;