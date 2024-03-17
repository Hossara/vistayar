import {v4 as uuidv4 } from "uuid"
import {SnapshotOptions, QueryDocumentSnapshot, DocumentData} from "firebase/firestore"

export class User implements DocumentData {
    private readonly id: string
    public username: string
    public first_name: string
    public last_name: string
    public phone: string
    public password: string

    constructor(id: string | null, first_name: string, last_name: string, phone: string, password: string) {
        this.id = id ?? uuidv4()
        this.first_name = first_name
        this.last_name = last_name
        this.phone = phone
        this.password = password
    }

    getId() {
        return this.id
    }

    getCredentials() {
        return {
            id: this.id,
            username: this.username,
            password: this.password
        }
    }
}

export const userConverter = {
    toFirestore: (user: User) => user,
    fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) =>
        snapshot.data(options) as User
}
