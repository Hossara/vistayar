import {supabase} from "@app"

export const searchByPhoneAndPassword = async (field: string, password: string) =>
    await supabase
        .from("users")
        .select("*")
        .eq("phone", field)
        .eq("password", password)
        .limit(1)
        .single()

export const updateProfileDetail = async (id: string, first_name: string, last_name: string) =>
    await supabase
        .from("users")
        .update({first_name, last_name})
        .eq("id", id)

export const findUserById = async (id: string) =>
    await supabase
        .from("users")
        .select()
        .eq("id", id)
        .limit(1)
        .single()