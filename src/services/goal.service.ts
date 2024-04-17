import {firebase} from "@app"
import {Goal, goalConverter} from "@/schemas/Goal.ts"

export const findGoalByUser = async (id: string) =>
    await firebase.collection("goals")
        .doc(id).get()

export const insertGoal = async (goal: Goal) =>
    await firebase.collection("goals")
        .doc(goal.getId()).set(goalConverter.toFirestore(goal))

export const updateGoal = async (id: string, goal: { [key: string]: any }) =>
    await firebase.collection("goals")
        .doc(id).set(goal, {merge: true})

export const deleteGoal = async (id: string) =>
    await firebase.collection("goals")
        .doc(id).delete()

export const deleteAllGoals = async () =>
    firebase.collection("goals").get().then((value) => {
        value.forEach((snapshot) => snapshot.ref.delete())
    })

export const findAllGoals = async () =>
    await firebase.collection('goals').get()