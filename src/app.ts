import dotenv from "dotenv"
import {SocksProxyAgent} from "socks-proxy-agent"
import {Context, Telegraf} from "telegraf"
import {Message, Update } from "telegraf/typings/core/types/typegram"
import {CommandContextExtn} from "telegraf/typings/telegram-types"
import {createClient} from "redis"
import {initializeApp, ServiceAccount, cert} from 'firebase-admin/app'
import {getFirestore} from 'firebase-admin/firestore'
import {WizardContext} from "telegraf/scenes"
import credential from "../db_info.json"

dotenv.config()
export const env = {
    ...process.env
} as {
    IS_DEV: string,
    BOT_TOKEN: string,
    PROXY: string,
    REDIS_SERVER: string,

    FIREBASE_apiKey: string,
    FIREBASE_authDomain: string,
    FIREBASE_projectId: string,
    FIREBASE_storageBucket: string,
    FIREBASE_messagingSenderId: string,
    FIREBASE_appId: string,
    FIREBASE_ADMIN_DATABASE: string
}

export const isDev: boolean = env.IS_DEV === 'TRUE'

export const proxy = new SocksProxyAgent(env.PROXY)

export const bot = new Telegraf(env.BOT_TOKEN, {
    telegram: {
        agent: isDev ? proxy : undefined,
    }
})

// Initialize Firebase
export const firebase = getFirestore(initializeApp({
    credential: cert(credential as ServiceAccount, proxy),
    databaseURL: env.FIREBASE_ADMIN_DATABASE,
    httpAgent: proxy
}))

// Initialize redis client
export const redisClient = createClient({
    url: env.REDIS_SERVER
})

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
    {command: "where_am_i", description: "کجای مسیرم؟"},
    {command: "need_to_talk", description: " حالم بده میشه حرف بزنیم؟"},
    {command: "edit_point", description: "ویرایش هدف هفته"},
])