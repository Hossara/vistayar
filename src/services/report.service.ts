import {firebase} from "@app"

export const insertReportByUser = async (id: string, update: any) =>
    await firebase.collection("goals").doc(id).update(update)