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