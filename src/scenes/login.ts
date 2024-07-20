import {Composer, Scenes} from "telegraf"
import {getInputText, redisClient} from "@app"
import {searchByPhoneAndPassword} from "@/services/user.service.ts"
import {findGoalByUser} from "@/services/goal.service.ts"
import {checkPhoneNumber} from "@/functions.ts"

interface LoginSession extends Scenes.WizardSessionData {
    phone: string
    password: string
}

export type LoginContext = Scenes.WizardContext<LoginSession>

// Scene registration
export const loginScene = new Scenes.WizardScene<LoginContext>('login',
    async (ctx) => {
        await ctx.reply("برای ورود به بات، شماره تلفن خودت رو وارد کن:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (!checkPhoneNumber(ctx.text)) {
            await ctx.reply("شماره تلفن ات معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.phone = getInputText(ctx.text)
        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        await ctx.reply("حالا رمز عبورت رو وارد کن:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 50) {
            await ctx.reply("رمز عبورت معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.password = getInputText(ctx.text)

        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        if (!ctx.scene.session.phone || !ctx.scene.session.password)
            return ctx.wizard.selectStep(0)

        const {data: user, error: error_search} = await searchByPhoneAndPassword(
            ctx.scene.session.phone,
            ctx.scene.session.password
        )

        await ctx.reply("درحال ورود...")

        if (!user || error_search) {
            if (error_search.code !== "PGRST116") console.log(error_search)

            await ctx.reply(error_search.code !== "PGRST116" ? "خطایی رخ داد!" : "شماره تلفن یا رمز عبور شما اشتباه است.")
            ctx.wizard.selectStep(0)
            ctx.scene.reset()
            return ctx.scene.leave()
        }

        await redisClient.hSet(ctx.chat.id.toString(), {
            id: user.id,
            chat_id: ctx.chat.id
        })

        ctx.wizard.selectStep(0)
        ctx.scene.reset()

        await ctx.reply(`${user.first_name} عزیز، خوش اومدی!`)

        await ctx.scene.leave()

        const {data: goal, error: error_find} = await findGoalByUser(user.id)

        if (!goal || error_find) await ctx.scene.enter("goal")
    },
)

loginScene.hears("خروج", async (ctx) => {
    await ctx.reply("از فرایند خارج شدی✋🏻")

    ctx.wizard.selectStep(0)

    ctx.scene.reset()

    return ctx.scene.leave()
})