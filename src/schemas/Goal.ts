import {v4 as uuidv4} from "uuid"
import {DocumentData, QueryDocumentSnapshot, DocumentSnapshot} from "firebase-admin/firestore"

export type Report = {
    test_count: number
    reading_time: number
}

export type Reports = {
    saturday?: Report | null,
    sunday?:  Report | null,
    monday?: Report | null,
    tuesday?: Report | null,
    wednesday?: Report | null,
    thursday?: Report | null,
    friday?: Report | null
}

export class Goal implements DocumentData {
    private readonly id: string
    public test_count: number
    public reading_time: number
    public reports: Reports

    constructor(id: string | null, test_count: number, reading_time: number, reports: Reports | null) {
        this.id = id ?? uuidv4()
        this.test_count = test_count
        this.reading_time = reading_time
        this.reports = reports ?? {
            saturday: null,
            sunday:  null,
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null
        }
    }

    getId() {
        return this.id
    }
}

export const goalConverter = {
    toFirestore: (goal: Goal) => ({
        test_count: goal.test_count,
        reading_time: goal.reading_time,
        reports: goal.reports,
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot | DocumentSnapshot): Goal => {
        const data = snapshot.data()

        return new Goal(
            snapshot.id,
            data.test_count,
            data.reading_time,
            data.reports,
        )
    }
}
