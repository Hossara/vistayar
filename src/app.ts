import dotenv from "dotenv"
import {SocksProxyAgent} from "socks-proxy-agent"
import {Context, Telegraf} from "telegraf"
import {Message, Update } from "telegraf/typings/core/types/typegram"
import {CommandContextExtn} from "telegraf/typings/telegram-types"
import {createClient as createRedisClient} from "redis"
import {createClient as createSupabaseClient} from "@supabase/supabase-js"
import {WizardContext} from "telegraf/scenes"
import {Database} from "../database.types.ts"

dotenv.config()
export const env = {
    ...process.env
} as {
    IS_DEV: string,
    BOT_TOKEN: string,
    PROXY: string,
    REDIS_SERVER: string,

    SUPABASE_SERVER: string,
    SUPABASE_SECRET: string
}

export const isDev: boolean = env.IS_DEV === 'TRUE'

export const proxy = env.PROXY ? new SocksProxyAgent(env.PROXY) : null

export const supabase = createSupabaseClient<Database>(env.SUPABASE_SERVER, env.SUPABASE_SECRET)

export const bot = new Telegraf(env.BOT_TOKEN, {
    telegram: {
        agent: isDev ? proxy : undefined,
    }
})

export const regexes = {
    safe_text: /^[a-zA-Z\s\u0600-\u06FF]{2,30}$/,
    time: /^(\d+h)?(\d+m)?$/,
    number: /^[\u06F0-\u06F90-9]*$/
}

export const getInputText = (text: string) => text
    .trim()
    .replace("http://", '')
    .replace("https://", '')
    .replace("file://", '')

// Initialize redis client
export const redisClient = createRedisClient({url: env.REDIS_SERVER})

redisClient.on('error', err => console.error("Redis error: ", err))

redisClient.connect()
    .then(() => console.log(`Redis is running at ${env.REDIS_SERVER}`))
    .catch((reason) => console.error("Redis error: ", reason))


export type CommandContext =  Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage,
    update_id: number
}> & Omit<WizardContext, keyof Context<any>> & CommandContextExtn

bot.telegram.setMyCommands([
    {command: "login", description: "ورود به حساب"},
    {command: "logout", description: "خروج از حساب"},
    {command: "insert_goal", description: "ثبت  یا ویرایش هدف هفته"},
    {command: "edit_goal", description: "ویرایش هدف هفته"},
    {command: "insert_report", description: "ثبت گزارش روزانه"},
    {command: "where_am_i", description: "کجای مسیرم؟"},
    {command: "need_to_talk", description: " حالم بده میشه حرف بزنیم؟"},
])