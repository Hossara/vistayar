import {Composer, Scenes} from "telegraf"
import {redisClient} from "@app"
import {userConverter} from "@/schemas/User.ts"
import {searchByUsernameAndPassword} from "@/services/user.service.ts"

const regex = /^[a-zA-Z\s\u0600-\u06FF]{2,30}$/

interface LoginSession extends Scenes.WizardSessionData {
    username: string
    password: string
}

export type LoginContext = Scenes.WizardContext<LoginSession>

const getInputText = (text: string) => text
    .trim()
    .replace("http://", '')
    .replace("https://", '')
    .replace("file://", '')

// Scene registration
export const loginScene = new Scenes.WizardScene<LoginContext>('login',
    async (ctx) => {
        await ctx.reply("لطفا نام کاربری خود را وارد کنید:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (!regex.test(ctx.text) || ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 30) {
            await ctx.reply("لطفا نام کاربری معتبر وارد کنید!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.username = getInputText(ctx.text)
        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        await ctx.reply("لطفا رمز عبور خود را وارد کنید:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 50) {
            await ctx.reply("لطفا رمز عبور معتبر وارد کنید!")
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

        await ctx.reply(`${user_data.first_name} عزیز شما با موفقیت وارد شدید!`)

        return ctx.scene.leave()
    },
)

loginScene.hears("خروج", async (ctx) => {
    await ctx.reply("شما از فرایند ورود خارج شدید")

    ctx.wizard.selectStep(0)

    ctx.scene.reset()

    return ctx.scene.leave()
})