import {Composer, Scenes} from "telegraf"
import {getInputText, redisClient, regexes} from "@app"
import {insertGoal, updateGoal} from "@/services/goal.service.ts"
import {Goal, Reports} from "@/schemas/Goal.ts"
import moment from "moment/moment"

export interface GoalSession extends Scenes.WizardSessionData {
    time: number,
    test_count: number,
    state: {
        is_update: boolean,
        is_report: boolean
    }
}

export type GoalContext = Scenes.WizardContext<GoalSession>

export const goalScene = new Scenes.WizardScene<GoalContext>('goal',
    async (ctx) => {
        await ctx.reply(`
لطفا تعداد ساعت مطالعه ${ctx.scene.session.state.is_report ? 'امروز خود را' : 'هدف خود را در هفته'} با فرمت زیر وارد کنید. برای مثال:
1h معادل ۱ ساعت
25m معادل ۲۵ دقیقه
1h25m معادل ۱ ساعت و ۲۵ دقیقه
`)
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        const text = getInputText(ctx.text)
        const text_match = text.match(regexes.time)

        if (text === "" || !text_match) {
            await ctx.reply("ساعت وارد شده معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        let hour = 0
        let minute = 0

        if (text_match[1]) hour = parseInt(text_match[1].slice(0, -1))
        if (text_match[2]) minute = parseInt(text_match[2].slice(0, -1))

        minute += hour * 60

        ctx.scene.session.time = minute

        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        await ctx.reply(`
لطفا تعداد تست ${ctx.scene.session.state.is_report ? 'امروز را' : 'هدف خود را در هفته'} به صورت عدد انگلیسی وارد کنید. برای مثال:
25
53
124
`)
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        const text = getInputText(ctx.text)
        const text_match = text.match(regexes.number)

        if (text === "" || !text_match) {
            await ctx.reply("تعداد تست وارد شده معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.test_count = +text

        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        const session = ctx.scene.session
        const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

        await ctx.reply("درحال بررسی و ثبت اطلاعات...")

        try {
            if (session.state.is_report) {
                const today = moment().format("dddd").toLowerCase() as keyof Reports

                let report = {
                    reports: {}
                } as {reports: Reports}

                report.reports[today] = {
                    test_count: session.test_count,
                    reading_time: session.time
                }

                await updateGoal(user_cache.id, report)

                await ctx.reply("گزارش روزانه شما ثبت شد.")
            }
            else {
                if (session.state.is_update) await updateGoal(user_cache.id, {test_count: session.test_count, time: session.time})
                else await insertGoal(new Goal(user_cache.id, session.test_count, session.time, null))

                await ctx.reply("هدف شما ثبت شد. شما میتوانید با دستور /insert_report تعداد ساعت مطالعه هر روز را ثبت کنید.")
            }

            ctx.wizard.selectStep(0)
            ctx.scene.reset()
            return ctx.scene.leave()
        } catch (e) {
            console.error("Error while inserting goal", e)
            await ctx.reply("خطایی هنگام ثبت اطلاعات رخ داد")
        }
    }
)

goalScene.hears("خروج", async (ctx) => {
    await ctx.reply("شما از فرایند خارج شدید")

    ctx.wizard.selectStep(0)

    ctx.scene.reset()

    return ctx.scene.leave()
})