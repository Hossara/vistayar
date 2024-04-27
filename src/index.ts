import {bot, CommandContext, redisClient} from "@app"
import {Scenes, session} from "telegraf"
import {WizardContext} from "telegraf/scenes"
import {loginScene} from "@/scenes/login.ts"
import {userConverter} from "@/schemas/User.ts"
import {findUserById} from "@/services/user.service.ts"
import {goalScene} from "@/scenes/goal.ts"
import cron from "node-cron"
import moment from "moment"
import {findGoalByUser} from "@/services/goal.service.ts"
import {goalConverter, Reports} from "@/schemas/Goal.ts"
import {insert_report_schedules} from "@/schedules/insert_report.ts"
import {weekly_summary_schedule} from "@/schedules/weekly_summary.ts"
import {days, isRedisDataExists} from "@/functions.ts"
import {smtaScene} from "@/scenes/send_message_to_all.ts"

const LOGIN_ERR = "هنوز وارد حسابت نشدی! روی /login کلیک کن تا وارد حسابت شو."

bot.start(async (ctx) => {
    await ctx.replyWithMarkdownV2(`
سلام ویستایی عزیز🧡
من برات یه دوست مجازی‌ام که کمک کنم مطالعه‌تو منظم‌ و پیوسته کنی و توی یه رقابت سالم با بقیه ویستایاری‌ها، به جایی که دلت میخواد نزدیک‌تر بشی\\. داستانمونو شروع کنیم؟🧡🫱🏻‍🫲🏻

برای ورود به حساب کاربری خود از دستور /login استفاده کنید\\.
برای توقف هر دستور از دستور، \*خروج\* را ارسال کنید\\.
`)
})

const stage = new Scenes.Stage<WizardContext>([loginScene, goalScene, smtaScene])

bot.use(session())
bot.use(stage.middleware())

bot.command('login', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if (isRedisDataExists(user_cache)) {
        const user = await findUserById(user_cache.id)

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

    if (!user_exists) return await ctx.reply(LOGIN_ERR)

    await redisClient.del(ctx.chat.id.toString())

    await ctx.reply("با موفقیت از حسابت خارج شدی، منتظر برگشتنت هستم! با کلید /login میتونی مجدد مسیرتو باهام شروع کنی!")
})

bot.command('insert_report', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if (!isRedisDataExists(user_cache)) return await ctx.reply(LOGIN_ERR)

    const goal = await findGoalByUser(user_cache.id)
    const today = moment().format("dddd").toLowerCase() as keyof Reports

    if (!goal.exists) await ctx.reply("شما هنوز هدفی برای این هفته ثبت نکردید. لطفا از طریق دستور /insert_goal هدف خود را ثبت کنید.")
    else {
        if (goalConverter.fromFirestore(goal).reports[today])
            await ctx.replyWithHTML("قبلا برای امروز گزارشت رو ثبت کردی!" +
                "با ادامه فرایند و ورود عدد جدید، گزارش امروز ویرایش میشه. ولی اگر قصد خروج از این فرایند رو داری، کلمه <u>خروج</u> رو بفرست.")

        await ctx.scene.enter("goal", {is_report: true})
    }
})

bot.command('insert_goal', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if (!isRedisDataExists(user_cache)) return await ctx.reply(LOGIN_ERR)

    const goal = await findGoalByUser(user_cache.id)

    if (goal.exists) await ctx.reply("قبلا هدف این هفته رو وارد کردی؛ برای ویرایش هدفت، کلید /edit_goal رو بزن.")
    else await ctx.scene.enter("goal")
})

bot.command('where_am_i', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if (!isRedisDataExists(user_cache)) return await ctx.reply(LOGIN_ERR)

    const goal_source = await findGoalByUser(user_cache.id)

    if (!goal_source.exists) return await ctx.reply("هنوز هدفی ثبت نکردی! با دستور /insert_goal هدفت رو ثبت کن.")

    const goal = goalConverter.fromFirestore(goal_source)
    const reports = Object.values(goal.reports).filter(Boolean)


    const total_read_time = reports.reduce((acc, obj) => acc + obj.reading_time, 0)
    const total_test_count = reports.reduce((acc, obj) => acc + obj.test_count, 0)

    let reply = `هدف تو برای این هفته این بوده که ${goal.reading_time} دقیقه درس بخونی و ${goal.test_count} تا تست بزنی؛\nتا اینجا، ${total_read_time} دقیقه خوندی و ${total_test_count} تا تست زدی👀`

    for (const day in goal.reports) {
        const report = goal.reports[day as keyof Reports]
        if (report) reply += `${days[day]}: ${report.reading_time} دقیقه مظالعه داشتی و ${report.test_count} تا تست زدی\n`
    }

    await ctx.replyWithHTML(reply)
})

bot.command('need_to_talk', (ctx) => ctx.replyWithHTML("من همیشه هستم، همین الان بهم پیام بده که مشکلو حل کنیم🧡\n@vistateam_admin"))

bot.command('edit_goal', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if(!isRedisDataExists(user_cache)) return await ctx.reply(LOGIN_ERR)

    const goal = await findGoalByUser(user_cache.id)

    if (!goal.exists) await ctx.scene.enter("goal")
    else await ctx.scene.enter("goal", {is_update: true})
})

bot.command('send_message', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    if(!isRedisDataExists(user_cache)) return await ctx.reply(LOGIN_ERR)

    const user_query = await findUserById(user_cache.id)
    const user = userConverter.fromFirestore(user_query)

    if (user.role === "ADMIN") await ctx.scene.enter("smta")
})

bot.launch()

const default_cron_config = {scheduled: true, timezone: "Asia/Tehran"}

cron.schedule("0 23 * * *", insert_report_schedules, default_cron_config)

cron.schedule("0 23 * * Friday", weekly_summary_schedule, default_cron_config)

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))