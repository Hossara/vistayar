import {AllGoalWithReport, deleteAllGoals, deleteGoal, findAllGoalsWithReports} from "@/services/goal.service.ts"
import {findUserById} from "@/services/user.service.ts"
import {iterateRedisKeys} from "@/functions.ts"
import {bot, supabase} from "@app"
import {extractNonNullReports} from "@/schemas/Goal.ts"

export const weekly_summary_schedule = async () => {
    const { data, error } = await supabase.rpc('weekly')

    if (error) return console.error("[Weekly report] Error while executing weekly summary", error)

    type WEEK_DATA = {
        id: string
        phone: string,
        goal_test_count: number,
        total_test_count: number,
        goal_reading_time: number,
        total_reading_time: number
    }

    //const weekly_data = new Map<string, WEEK_DATA>
    //const weekly_data = new Map<string, WEEK_DATA & {success: boolean}>
    const weekly_pure: WEEK_DATA[] = data ?? [] as WEEK_DATA[]

    //weekly_pure.map((value) => weekly_data.set(value.id, value))

    // Iterate on list of users in redis
    await iterateRedisKeys(async (value: { id: string, chat_id: string }) => {
        const d = weekly_pure.findIndex((d) => d.id === value.id)

        if (d === -1) return

        const score = weekly_pure[d]

        const chat_id = value.chat_id.toString()

        let top5_text = `یه خبر خوب! با رتبه ${d} جزو ۵ نفر برتر هفته شدی!\n`

        top5_text += "رتبه ۵ نفر اول: \n"

        for (let i = 0; i < weekly_pure.length; i++) {
            top5_text += `${i + 1}) \n ${weekly_pure[i].total_test_count} تست - ${weekly_pure[i].total_reading_time} دقیقه مطالعه \n`
        }

        await bot.telegram.sendMessage(chat_id, top5_text, {
            parse_mode: "HTML"
        })


        /*if (score.success) {
            await bot.telegram.sendMessage(chat_id, `دمت گرم ${score.full_name.split(" ")[0]}! یه قدمِ دیگه نزدیک‌تر به هدفت:) خسته‌ی این هفته نباشی. برنامه‌تو آماده کن که روزای خوب توی راهه🔥`)

            if (top5.has(value.id)) {
                const top5_info = top5.get(value.id)

                let top5_text = `یه خبر خوب! با رتبه ${top5_info.score} جزو ۵ نفر برتر هفته شدی!\n`

                top5_text += "رتبه ۵ نفر اول: \n"

                let i = 1
                top5.forEach((value) => {
                    top5_text += `${i}) \n ${value.total_test_count} تست - ${value.total_read_time} دقیقه مطالعه \n`
                    i++
                })

                await bot.telegram.sendMessage(chat_id, top5_text, {
                    parse_mode: "HTML"
                })
            }
        }
        else await bot.telegram.sendMessage(chat_id, "با اینکه این هفته اونی که میخواستی نشد، ولی هنوز وقت هست واسه ساختن و نجات دادنِ هدفات؛ به حای سرزنش، دستِ خودتو بگیر و بلندش کن واسه جنگیدن برای زندگی🧡")
*/
/*        await bot.telegram.sendMessage(chat_id, `این هفته ${score.total_read_time} دقیقه مطالعه کردی و ${score.total_test_count} تا تست زدی!`, {
            parse_mode: "HTML"
        })
        await bot.telegram.sendMessage(chat_id, `هدفی که برای این هفته تعیین کردی ${score.goal_read_time} دقیقه مطالعه و ${score.goal_test_count} عدد تست بود.`)

        await deleteAllGoals()*/
    })
}