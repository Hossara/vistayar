import {bot, CommandContext, redisClient} from "@app"
import {Scenes, session} from "telegraf"
import {WizardContext} from "telegraf/scenes"
import {loginScene} from "@/scenes/login.ts"
import {userConverter} from "@/schemas/User.ts"
import {findUserById} from "@/services/user.service.ts"
import {goalScene} from "@/scenes/goal.ts"
import cron from "node-cron"
import moment from "moment"
import {iterateRedisKeys} from "@/functions.ts"
import {deleteAllGoals, deleteGoal, findAllGoals, findGoalByUser} from "@/services/goal.service.ts"
import {goalConverter, Reports} from "@/schemas/Goal.ts"

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

    if (!(user_cache === null || Object.keys(user_cache).length === 0)) {
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

    if (user_exists) {
        await redisClient.del(ctx.chat.id.toString())
        await ctx.reply(`
با موفقیت از حسابت خارج شدی، منتظر برگشتنت هستم! با کلید /login میتونی مجدد مسیرتو باهام شروع کنی!
`)
    }
    else await ctx.reply("شما در حساب خود وارد نشده اید. برای ورود به حساب از دستور /login استفاده نمایید.")
})

bot.command('insert_report', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

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

    const goal = await findGoalByUser(user_cache.id)

    if (goal.exists) await ctx.reply("قبلا هدف این هفته رو وارد کردی؛ برای ویرایش هدفت، کلید /edit_goal رو بزن.")
    else await ctx.scene.enter("goal")
})

bot.command('where_am_i', (ctx) => ctx.reply('Hello'))
bot.command('need_to_talk', (ctx) => ctx.replyWithHTML("برای ارتباط با پشتیبان روی آی‌دی زیر کلیک کن:\n@vistateam_admin"))

bot.command('edit_goal', async (ctx: CommandContext) => {
    const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

    const goal = await findGoalByUser(user_cache.id)

    if (!goal.exists) await ctx.scene.enter("goal")
    else await ctx.scene.enter("goal", {is_update: true})
})

bot.launch()

cron.schedule("0 23 * * *", async () => {
    await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) => {
        await bot.telegram.sendMessage(value.chat_id.toString(), "سلام! شب بخیر. لطفا گزارش روزانه خود را از طریق دستور /insert_report ثبت کنید.")
    })
}, {
    scheduled: true,
    timezone: "Asia/Tehran"
})

cron.schedule("0 23 * * Friday", async () => {
    const goals = await findAllGoals()

    if (!goals || goals.empty) {
        console.log("No goals found.")
        return
    }

    const scores = new Map<string, {
        full_name: string,
        success: boolean
        total_read_time: number
        total_test_count: number,
        goal_read_time: number
        goal_test_count: number,
        score?: number
    }>()

    for (const goalsKey of goals.docs) {
        const doc = goalConverter.fromFirestore(goalsKey)

        const userQuery  = await findUserById(doc.getId())
        const user = userConverter.fromFirestore(userQuery)

        if (!userQuery || !userQuery.exists) {
            await deleteGoal(doc.getId())

            continue
        }

        const total_read_time = Object.values(doc.reports).reduce((acc, obj) => acc + obj.reading_time, 0)
        const total_test_count = Object.values(doc.reports).reduce((acc, obj) => acc + obj.test_count, 0)

        scores.set(doc.getId(), {
            full_name: `${user.first_name} ${user.last_name}`,
            total_read_time, total_test_count, goal_test_count: doc.test_count, goal_read_time: doc.reading_time,
            success: total_read_time >= doc.reading_time && total_test_count >= doc.test_count
        })
    }

    // Filter users with successful goal
    // Sort by total read time and total test count with total read time priority
    // Slice top 5
    const top5 = new Map([...scores.entries()]
        .filter((value) => value[1].success)
        .sort((a, b) => a[1].total_read_time - b[1].total_read_time || a[1].total_test_count - b[1].total_test_count)
        .slice(0, 5)
        .map((value, index) => {
            value[1].score = index + 1
            return value
        }))

    // Iterate on list of users in redis
    await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) => {
        const score = scores.get(value.id)
        const chat_id = value.chat_id.toString()
        const sendMessage = bot.telegram.sendMessage

        if (score.success) {
            await sendMessage(chat_id, "موفق شدی! تونستی با موفقیت هدف خودت رو بزنی!")

            if (top5.has(value.id)) {
                const top5_info = top5.get(value.id)

                let top5_text = `یه خبر خوب! با رتبه ${top5_info.score} جزو ۵ نفر برتر هفته شدی!\n`

                top5_text += "رتبه ۵ نفر اول: \n"

                for (const top5_user of top5) {
                    top5_text += `1) حسین عراقی \n ${top5_info.total_test_count} تست - ${top5_info.total_read_time} دقیقه مطالعه \n`
                }

                await sendMessage(chat_id, top5_text, {
                    parse_mode: "HTML"
                })
            }
        }
        else {
            await sendMessage(chat_id, "سلام! یک هفته گذشت و نتونستی هدفت رو بزنی!")
        }

        await sendMessage(chat_id, `این هفته ${score.total_read_time} دقیقه مطالعه کردی و ${score.total_test_count} تا تست زدی!`, {
            parse_mode: "HTML"
        })
        await sendMessage(chat_id, `هدفی که برای این هفته تعیین کردی ${score.goal_read_time} دقیقه مطالعه و ${score.goal_test_count} عدد تست بود.`)

        await deleteAllGoals()
    })
}, {
    scheduled: true,
    timezone: "Asia/Tehran"
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))