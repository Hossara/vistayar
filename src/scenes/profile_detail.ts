import {Composer, Scenes} from "telegraf"
import {getInputText, redisClient} from "@app"
import {updateProfileDetail} from "@/services/user.service.ts"

interface UpdateProfileDetailsSession extends Scenes.WizardSessionData {
    first_name: string
    last_name: string
}

export type UpdateProfileDetailsContext = Scenes.WizardContext<UpdateProfileDetailsSession>

// Scene registration
export const updateProfileDetailsScene = new Scenes.WizardScene<UpdateProfileDetailsContext>('updateProfileDetailsScene',
    async (ctx) => {
        await ctx.reply("لطفا نام خودت رو وارد کن:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 50) {
            await ctx.reply("نامی که وارد کردی معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.first_name = getInputText(ctx.text)
        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        await ctx.reply("حالا نام خانوادگیت رو وارد کن:")
        return ctx.wizard.next()
    },
    async (ctx, next) => {
        if (ctx.text[0] === '/' || ctx.text.length < 3 || ctx.text.length > 50) {
            await ctx.reply("نام خانوادگیت معتبر نبود!")
            ctx.wizard.back()
            return Composer.unwrap(ctx.wizard.step)(ctx, next)
        }

        ctx.scene.session.last_name = getInputText(ctx.text)

        ctx.wizard.next()
        return Composer.unwrap(ctx.wizard.step)(ctx, next)
    },
    async (ctx) => {
        if (!ctx.scene.session.first_name || !ctx.scene.session.last_name)
            return ctx.wizard.selectStep(0)

        const user_cache = await redisClient.hGetAll(ctx.chat.id.toString())

        if (!user_cache) {
            await ctx.reply("لطفا ابتدا در بات وارد شوید")
            ctx.wizard.selectStep(0)
            ctx.scene.reset()
            return ctx.scene.leave()
        }

        const {error: error_update} = await updateProfileDetail(
            user_cache.id,
            ctx.scene.session.first_name,
            ctx.scene.session.last_name
        )

        await ctx.reply("درحال ذخیره اطلاعات...")

        if (error_update) {
            console.log(error_update)

            await ctx.reply("خطایی هنگام ثبت اطلاعات رخ داد!")
            ctx.wizard.selectStep(0)
            ctx.scene.reset()
            return ctx.scene.leave()
        }

        ctx.wizard.selectStep(0)
        ctx.scene.reset()

        await ctx.reply(`اطلاعات با موفقیت ذخیره شد`)

        await ctx.scene.leave()
    },
)