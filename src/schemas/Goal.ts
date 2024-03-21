import {v4 as uuidv4} from "uuid"
import {DocumentData, QueryDocumentSnapshot, DocumentSnapshot} from "firebase-admin/firestore"

export type Report = {
    date: Date
    test_count: number
    reading_time: number
}

export class Goal implements DocumentData {
    private readonly id: string
    public user: string
    public test_count: number
    public reading_time: number
    public reports: Report[]

    constructor(id: string | null, user: string, test_count: number, reading_time: number, reports: Report[]) {
        this.id = id ?? uuidv4()
        this.user = user
        this.test_count = test_count
        this.reading_time = reading_time
        this.reports = reports
    }

    getId() {
        return this.id
    }
}

export const goalConverter = {
    toFirestore: (goal: Goal) => ({
        user: goal.user,
        test_count: goal.test_count,
        reading_time: goal.reading_time,
        reports: goal.reports,
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot | DocumentSnapshot): Goal => {
        const data = snapshot.data()

        return new Goal(
            snapshot.id,
            data['user'],
            data['test_count'],
            data['reading_time'],
            data['reports'],
        )
    }
}
