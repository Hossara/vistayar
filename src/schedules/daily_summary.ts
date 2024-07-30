import {supabase} from "@app";
import moment from "moment";
import {Reports} from "@/schemas/Goal.ts";
import {QueryData} from "@supabase/supabase-js";
import {findGoalWithReportByUser} from "@/services/goal.service.ts";

export const daily_summary_schedule = async () => {
   /* select
        u.phone,
        cast(g.test_count as integer),
        cast(g.reading_time as integer),
        cast(r.wednesday ->> 'reading_time' as integer) as day_reading_time,
        cast(r.wednesday ->> 'test_count' as integer) as day_test_count
    from
        goals g
        join users u on g.user = u.id
        join reports r on g.reports = r.id
    where
        r.wednesday is not null
    order by
        day_reading_time desc,
        day_test_count desc
    limit
        5;*/

    const today = moment().subtract(1, 'd').format("dddd").toLowerCase() as keyof Reports

    console.log(today)

    const query = async () => await supabase
        .from("goals")
        .select(`
            test_count,
            reading_time,
            users (phone),
            reports!inner(${today}->reading_time, ${today}->test_count)
        `)
        .neq(`reports.${today}`, null)

    const {data: query_data, error} = await query()

    const data: QueryData<ReturnType<typeof query>> = query_data

    console.log(data.sort((a, b) =>
        (b.reports.reading_time as number) - (a.reports.reading_time as number)
        || (b.reports.test_count as number) - (a.reports.test_count as number)
    ).slice(0, 5))

    console.log(error)
}