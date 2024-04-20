import {iterateRedisKeys} from "@/functions.ts"
import {bot} from "@app"

export const insert_report_schedules = async () => {
    await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) => {
        await bot.telegram.sendMessage(value.chat_id.toString(), "سلام! شب بخیر. لطفا گزارش روزانه خود را از طریق دستور /insert_report ثبت کنید.")
    })
}