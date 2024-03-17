import {bot, redisClient} from "@app"
import {Middleware, Scenes, session} from "telegraf"
import {Stage} from "telegraf/scenes"
import {LoginContext, loginScene} from "@/commands/login.ts"

bot.start(async (ctx) => {
    await ctx.replyWithMarkdownV2(`
سلام ویستایی عزیز🧡
من برات یه دوست مجازی‌ام که کمک کنم مطالعه‌تو منظم‌ و پیوسته کنی و توی یه رقابت سالم با بقیه ویستایاری‌ها، به جایی که دلت میخواد نزدیک‌تر بشی\\. داستانمونو شروع کنیم؟🧡🫱🏻‍🫲🏻

برای ورود به حساب کاربری خود از دستور /login استفاده کنید\\.
برای توقف هر دستور از دستور، \*خروج\* را ارسال کنید\\.
`)
})

const stage = new Scenes.Stage<LoginContext>([loginScene])

bot.use(session())
bot.use(stage.middleware())

bot.command('login', async (ctx) => {
    const user_exists = await redisClient.exists(ctx.chat.id.toString())

    if (user_exists) {
        await ctx.reply(`
            شما قبلا وارد شدید!
            برای خروج از حساب از دستور /logout استفاده کنید.
        `)
    }
    else {
        Stage.action("redo", stage.middleware() as Middleware<any>)
    }
})

bot.command('logout', async (ctx) => {
    const user_exists = await redisClient.exists(ctx.chat.id.toString())

    if (user_exists) {
        await redisClient.del(ctx.chat.id.toString())
        await ctx.reply(`
        شما با موفیت از حساب خود خارج شدید.
        برای ورود مجدد از دستور /login استفاده کنید.
        `)
    }
    else await ctx.reply("شما در حساب خود وارد نشده اید. برای ورود به حساب از دستور /login استفاده نمایید.")
})

bot.command('where_am_i', (ctx) => ctx.reply('Hello'))
bot.command('need_to_talk', (ctx) => ctx.reply('Hello'))
bot.command('edit_point', (ctx) => ctx.reply('Hello'))

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))