import {QueryData} from "@supabase/supabase-js";

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

export const extractNonNullReports = (queryResult: any): (Report | null)[] => {
    const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

    const nonNullReports: (Report | null)[] = [];

    for (const day of days) {
        if (queryResult[day] !== null && queryResult[day] !== undefined) {
            nonNullReports.push(queryResult[day]);
        }
    }

    return nonNullReports;
}
