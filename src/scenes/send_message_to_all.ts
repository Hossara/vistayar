import {Scenes} from "telegraf"
import {bot, getInputText} from "@app"
import {iterateRedisKeys} from "@/functions.ts"


export type SMTAContext = Scenes.WizardContext

export const smtaScene = new Scenes.WizardScene<SMTAContext>('smta',
    async (ctx) => {
        await ctx.replyWithHTML("سلام! لطفا در پیام بعدی، پیامی که میخوای برای کاربرا ارسال کنی رو بفرست. حواست باشه که پیامی که ارسال میکنی قابل ادیت نیست. اگر منصرف شدی، با دستور <b>خروج</b> از فرایند ارسال پیام خارج شو.")
        return ctx.wizard.next()
    },
    async (ctx) => {
        await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) =>
            await bot.telegram.sendMessage(value.chat_id, getInputText(ctx.text))
        )

        ctx.wizard.selectStep(0)
        ctx.scene.reset()
        return ctx.scene.leave()
    }
)

smtaScene.hears("خروج", async (ctx) => {
    await ctx.reply("از فرایند خارج شدی✋🏻")

    ctx.wizard.selectStep(0)

    ctx.scene.reset()

    return ctx.scene.leave()
})