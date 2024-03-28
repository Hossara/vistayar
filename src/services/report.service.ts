import {firebase} from "@app"
import {Report} from "@/schemas/Goal"
import {firestore} from "firebase-admin"

export const insertReportByUser = async (id: string, report: Report) =>
    await firebase.collection("goals").doc(id).update({
            reports: firestore.FieldValue.arrayUnion(report)
    })