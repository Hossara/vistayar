import {bot, CommandContext, redisClient} from "@app"
import {Scenes, session} from "telegraf"
import {WizardContext} from "telegraf/scenes"
import {loginScene} from "@/scenes/login.ts"
import {userConverter} from "@/schemas/User.ts"
import {findById} from "@/services/user.service.ts"
import {goalScene} from "@/scenes/goal.ts"
import cron from "node-cron"
import moment from "moment"
import {iterateRedisKeys} from "@/functions.ts"
import {findGoalByUser} from "@/services/goal.service.ts"

bot.start(async (ctx) => {
    await ctx.replyWithMarkdownV2(`
سلام ویستایی عزیز🧡
من برات یه دوست مجازی‌ام که کمک کنم مطالعه‌تو منظم‌ و پیوسته کنی و توی یه رقابت سالم با بقیه ویستایاری‌ها، به جایی که دلت میخواد نزدیک‌تر بشی\\. داستانمونو شروع کنیم؟🧡🫱🏻‍🫲🏻

برای ورود به حساب کاربری خود از دستور /login استفاده کنید\\.
برای توقف هر دستور از دستور، \*خروج\* را ارسال کنید\\.
`)
})

const stage = new Scenes.Stage<WizardContext>([loginScene, goalScene])

bot.use(session())
bot.use(stage.middleware())

bot.command('login', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if (user_cache) {
        const user = await findById(user_cache.id)
        if (user) {
            await redisClient.del(user_cache.id)
            await ctx.scene.enter("login")
        }

        else await ctx.reply(`
${userConverter.fromFirestore(user).first_name} عزیز شما قبلا وارد شدید!
برای خروج از حساب از دستور /logout استفاده کنید.
        `)
    }
    else await ctx.scene.enter("login")
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

bot.command('insert_report', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    const goal = await findGoalByUser(user_cache.id)

    if (!goal.exists) await ctx.reply("شما هنوز هدفی برای این هفته ثبت نکردید. لطفا از طریق دستور /insert_goal هدف خود را ثبت کنید.")
    else await ctx.scene.enter("goal", {is_report: true})
})

bot.command('insert_goal', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    const goal = await findGoalByUser(user_cache.id)

    if (goal.exists) await ctx.reply("شما قبلا هدف خود را ثبت کرده اید. برای ویرایش آن از طریق دستور /edit_goal اقدام کنید.")
    else await ctx.scene.enter("goal")
})


bot.command('where_am_i', (ctx) => ctx.reply('Hello'))
bot.command('need_to_talk', (ctx) => ctx.reply('Hello'))
bot.command('edit_point', async (ctx: CommandContext) => await ctx.scene.enter("goal", {is_update: true}))

bot.launch()

cron.schedule("0 8 * * *", async () => {
    const today = moment().isoWeekday()

    if (today !== 5 && today !== 6) {
        await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) => {
            console.log(value)
            await bot.telegram.sendMessage(value.chat_id.toString(), "سلام! صبح بخیر. لطفا گزارش روزانه خود را از طریق دستور /insert_report ثبت کنید.")
        })
    }
}, {
    scheduled: true,
    timezone: "Asia/Tehran"
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))