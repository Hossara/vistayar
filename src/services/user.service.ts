import {firebase} from "@app"

export const searchByUsernameAndPassword = async (username: string, password: string) =>
    await firebase.collection("users")
        .where("username", "==", username)
        .where("password", "==", password)
        .get()

export const findById = async (id: string) =>
    await firebase.collection("users")
        .doc(id).get()