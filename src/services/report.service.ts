import {supabase} from "@app"
import {Report} from "@/schemas/Goal.ts"

export const insertReportByUser = async (id: string, update: { [key: string]: Report}) =>
    await supabase
        .from("reports")
        .insert({...update, user: id})
        .select()
        .single()