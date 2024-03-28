import {redisClient} from "@app"

export const iterateRedisKeys = async (
    each: (value: any) => void
) => {
    let data = null
    for await (const key of redisClient.scanIterator({MATCH: '*', COUNT: 10})) {
        data = await redisClient.hGetAll(key)
        if (data) each(data)
    }
}