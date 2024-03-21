import {firebase} from "@app"
import {Goal, goalConverter} from "@/schemas/Goal.ts"

export const findGoalByUser = async (id: string) =>
    await firebase.collection("goals")
        .where("user", "==", id)
        .get()

export const insertGoal = async (goal: Goal) =>
    await firebase.collection("goals")
    .doc().set(goalConverter.toFirestore(goal))