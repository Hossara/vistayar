import {Composer, Scenes} from "telegraf"
import {getInputText, redisClient, regexes} from "@app"
import {userConverter} from "@/schemas/User.ts"
import {searchByUsernameAndPassword} from "@/services/user.service.ts"
import {findGoalByUser} from "@/services/goal.service.ts"

interface LoginSession extends Scenes.WizardSessionData {
    username: string
    password: string
}

export type LoginContext = Scenes.WizardContext<LoginSession>


// Scene registration
export const loginScene = new Scenes.WizardScene<LoginContext>('login',
    async (ctx) => {
        await ctx.reply("برای ورود به بات، نام کاربری‌ خودت رو وارد کن:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (!regexes.safe_text.test(ctx.text) || ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 30) {
            await ctx.reply("نام کاربریت معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.username = getInputText(ctx.text)
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
        if (!ctx.scene.session.username || !ctx.scene.session.password)
            return ctx.wizard.selectStep(0)

        const user = await searchByUsernameAndPassword(
            ctx.scene.session.username,
            ctx.scene.session.password
        )

        await ctx.reply("درحال ورود...")

        if (!user.docs[0] || !user.docs[0].exists) {
            await ctx.reply("نام کاربری یا رمز عبور شما اشتباه است.")
            ctx.wizard.selectStep(0)
            ctx.scene.reset()
            return ctx.scene.leave()
        }

        const user_data = userConverter.fromFirestore(user.docs[0])

        await redisClient.hSet(ctx.chat.id.toString(), {
            id: user_data.getId(),
            username: user_data.username,
            chat_id: ctx.chat.id
        })

        ctx.wizard.selectStep(0)
        ctx.scene.reset()

        await ctx.reply(`${user_data.first_name} عزیز، خوش اومدی!`)

        await ctx.scene.leave()

        const goal = await findGoalByUser(user_data.getId())

        if (!goal.exists) await ctx.scene.enter("goal")
    },
)

loginScene.hears("خروج", async (ctx) => {
    await ctx.reply("از فرایند خارج شدی✋🏻")

    ctx.wizard.selectStep(0)

    ctx.scene.reset()

    return ctx.scene.leave()
})