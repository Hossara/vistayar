import {deleteAllGoals, deleteGoal, findAllGoals} from "@/services/goal.service.ts"
import {goalConverter} from "@/schemas/Goal.ts"
import {findUserById} from "@/services/user.service.ts"
import {userConverter} from "@/schemas/User.ts"
import {iterateRedisKeys} from "@/functions.ts"
import {bot} from "@app"

export const weekly_summary_schedule = async () => {
    const goals = await findAllGoals()

    if (!goals || goals.empty) {
        console.log("No goals found.")
        return
    }

    const scores = new Map<string, {
        full_name: string,
        success: boolean
        total_read_time: number
        total_test_count: number,
        goal_read_time: number
        goal_test_count: number,
        score?: number
    }>()

    for (const goalsKey of goals.docs) {
        const doc = goalConverter.fromFirestore(goalsKey)

        const userQuery  = await findUserById(doc.getId())
        const user = userConverter.fromFirestore(userQuery)

        if (!userQuery || !userQuery.exists) {
            await deleteGoal(doc.getId())

            continue
        }

        const reports = Object.values(doc.reports).filter(Boolean)

        const total_read_time = reports.reduce((acc, obj) => acc + obj.reading_time, 0)
        const total_test_count = reports.reduce((acc, obj) => acc + obj.test_count, 0)

        scores.set(doc.getId(), {
            full_name: `${user.first_name} ${user.last_name}`,
            total_read_time, total_test_count, goal_test_count: doc.test_count, goal_read_time: doc.reading_time,
            success: total_read_time >= doc.reading_time && total_test_count >= doc.test_count
        })
    }

    // Filter users with successful goal
    // Sort by total read time and total test count with total read time priority
    // Slice top 5
    const top5 = new Map([...scores.entries()]
        .filter((value) => value[1].success)
        .sort((a, b) => a[1].total_read_time - b[1].total_read_time || a[1].total_test_count - b[1].total_test_count)
        .slice(0, 5)
        .map((value, index) => {
            value[1].score = index + 1
            return value
        }))

    // Iterate on list of users in redis
    await iterateRedisKeys(async (value: { id: string, username: string, chat_id: string }) => {
        const score = scores.get(value.id)
        const chat_id = value.chat_id.toString()

        if (score.success) {
            await bot.telegram.sendMessage(chat_id, "موفق شدی! تونستی با موفقیت هدف خودت رو بزنی!")

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
        else await bot.telegram.sendMessage(chat_id, "سلام! یک هفته گذشت و نتونستی هدفت رو بزنی!")

        await bot.telegram.sendMessage(chat_id, `این هفته ${score.total_read_time} دقیقه مطالعه کردی و ${score.total_test_count} تا تست زدی!`, {
            parse_mode: "HTML"
        })
        await bot.telegram.sendMessage(chat_id, `هدفی که برای این هفته تعیین کردی ${score.goal_read_time} دقیقه مطالعه و ${score.goal_test_count} عدد تست بود.`)

        await deleteAllGoals()
    })
}