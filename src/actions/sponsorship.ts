import { Sponsor } from "../types";
import TelegramBot from "../TelegramBot";

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
            
            if (result) {
                ctx.editMessageReplyMarkup(undefined);
                ctx.reply('Спасибо за Вашу поддержку!');
            } 
        } else {
            throw new Error('Internal bot error.');
        }
    });
}

export default sponsorship;