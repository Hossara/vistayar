import {supabase} from "@app"
import {Report} from "@/schemas/Goal.ts"

export const findReportByUser = async (id: string) =>
    await supabase
        .from("reports")
        .select("*")
        .eq("user", id)
        .limit(1)
        .single()

export const updateReportByUser = async (id: string, update: { [key: string]: Report }) =>
    await supabase
        .from("reports")
        .update({...update})
        .eq("user", id)

export const insertReportByUser = async (id: string, data: { [key: string]: Report}) =>
    await supabase
        .from("reports")
        .insert({...data, user: id})
        .select()
        .single()