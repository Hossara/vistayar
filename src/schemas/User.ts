import {v4 as uuidv4 } from "uuid"
import {QueryDocumentSnapshot, DocumentData} from "firebase-admin/firestore"
import {firestore} from "firebase-admin"
import DocumentSnapshot = firestore.DocumentSnapshot

export enum USER_ROLE {
    ADMIN= 'ADMIN',
    STUDENT = 'STUDENT'
}

export class User implements DocumentData {
    private readonly id: string
    public username: string
    public first_name: string
    public last_name: string
    public phone: string
    public role: USER_ROLE
    public password: string

    constructor(id: string | null, username: string, first_name: string, last_name: string, phone: string, role: USER_ROLE, password: string) {
        this.id = id ?? uuidv4()
        this.username = username
        this.first_name = first_name
        this.last_name = last_name
        this.phone = phone
        this.role = role
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
    toFirestore: (user: User) => ({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role.toString(),
        password: user.password,
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot | DocumentSnapshot): User => {
        const data = snapshot.data()

        return new User(
            snapshot.id,
            data['username'],
            data['first_name'],
            data['last_name'],
            data['phone'],
            data['role'],
            data['password'],
        )
    }
}
