import {iterateRedisKeys} from "@/functions.ts"
import {bot} from "@app"

export const insert_report_schedules = async () => {
    await iterateRedisKeys(async (value: { id: string, chat_id: string }) => {
        try {
            await bot.telegram.sendMessage(value.chat_id.toString(), "سلام! شب بخیر. لطفا گزارش روزانه خود را از طریق دستور /insert_report ثبت کنید.")
        }
        catch (e) {
            console.error(`[Daily Report] Error while sending message to user ${value.id}. chat: ${value.chat_id.toString()}`)
        }
    })
}