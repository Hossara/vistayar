import {Scenes} from "telegraf"
import { collection, query, where, and, getDocs } from "firebase/firestore"
import {firebase, redisClient} from "@app"
import {User} from "@/schemas/User.ts"

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
    async (ctx) => {
        if (!regex.test(ctx.text) || ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 30) {
            await ctx.reply("لطفا نام کاربری معتبر وارد کنید!")
            return ctx.wizard.back()
        }

        ctx.scene.session.username = getInputText(ctx.text)

        return ctx.wizard.next()
    },
    async (ctx, next) => {
        await ctx.reply("لطفا رمز عبور خود را وارد کنید:")
        await next()
    },
    async (ctx) => {
        if (ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 50) {
            await ctx.reply("لطفا رمز عبور معتبر وارد کنید!")
            return ctx.wizard.back()
        }

        ctx.scene.session.password = getInputText(ctx.text)

        return ctx.wizard.next()
    },
    async (ctx) => {
        if (!ctx.scene.session.username || !ctx.scene.session.password)
            return ctx.wizard.selectStep(0)

        const user =
            await getDocs(query(collection(firebase, "users"), and(
                where("username", "==", ctx.scene.session.username),
                where("password", "==", ctx.scene.session.password),
            )))

        if (!user.docs[0].exists()) {
            await ctx.reply("خطایی در سرور رخ داده است. نام کاربری یا رمز عبور شما در session موجود نیست. لطفا دوباره از دستور /login وارد سیستم شوید.")
            ctx.wizard.selectStep(0)
            ctx.session = {}
            ctx.scene.reset()
            return ctx.scene.leave()
        }

        const user_data = user.docs[0].data() as User

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

/*loginScene.hears("حروج", async (ctx) => {
    await ctx.reply("شما از فرایند ورود خارج شدید")
    return ctx.scene.leave()
})*/

loginScene.action("redo", (ctx) => {
    ctx.wizard.selectStep(0)
    ctx.scene.reset()
    ctx.scene.reenter()
})