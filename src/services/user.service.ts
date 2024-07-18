import {supabase} from "@app"

export const searchByPhoneAndPassword = async (field: string, password: string) =>
    await supabase
        .from("users")
        .select("*")
        .eq("phone", field)
        .eq("password", password)
        .limit(1)
        .single()

export const findUserById = async (id: string) =>
    await supabase
        .from("users")
        .select()
        .eq("id", id)
        .limit(1)
        .single()