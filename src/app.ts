import dotenv from "dotenv"
import {SocksProxyAgent} from "socks-proxy-agent"
import {Telegraf} from "telegraf"

dotenv.config()
export const env = {
    ...process.env
} as {
    IS_DEV: string,
    BOT_TOKEN: string,
    PROXY: string
}

export const isDev: boolean = env.IS_DEV === 'TRUE'

export const proxy = new SocksProxyAgent(env.PROXY)

export const bot = new Telegraf(env.BOT_TOKEN, {
    telegram: {
        agent: isDev ? proxy : undefined,
    }
})

export const cache: string[] = []

bot.telegram.setMyCommands([
    {command: "login", description: "ورود به حساب"},
    {command: "where_am_i", description: "کجای مسیرم؟"},
    {command: "need_to_talk", description: " حالم بده میشه حرف بزنیم؟"},
    {command: "edit_point", description: "ویرایش هدف هفته"},
])
