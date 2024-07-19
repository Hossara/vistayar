import {supabase} from "@app"
import {QueryData} from "@supabase/supabase-js"

export const findGoalByUser = async (id: string) =>
    await supabase
        .from("goals")
        .select()
        .eq("user", id)
        .limit(1)
        .single()

export const findGoalWithReportByUser = async (id: string) =>
    await supabase
        .from("goals")
        .select("*, reports (*)")
        .eq("user", id)
        .limit(1)
        .single()

export type GoalWithReport = QueryData<ReturnType<typeof findGoalWithReportByUser>>

export const insertGoal = async (user_id: string, test_count: number, time: number) =>
    await supabase
        .from("goals")
        .insert({user: user_id, test_count, reading_time: time})

export const updateGoal = async (id: string, goal: { [key: string]: any }) =>
    await supabase
        .from("goals")
        .update({...goal})
        .eq("user", id)

export const deleteGoal = async (id: string) =>
    await supabase
        .from("goals")
        .delete()
        .eq("user", id)

export const deleteAllGoals = async () =>
    await supabase
        .from("goals")
        .delete()

export const findAllGoalsWithReports = async () =>
    await supabase
        .from("goals")
        .select("*, reports (*)")

export type AllGoalWithReport = QueryData<ReturnType<typeof findAllGoalsWithReports>>
