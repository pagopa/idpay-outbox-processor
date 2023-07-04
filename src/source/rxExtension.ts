import {retry, timer} from "rxjs";


/**
 * A rxjs operator to retry a specific operation by using a backoff policy
 * @param options Backoff retry options
 * @returns 
 */
export function retryWithBackoff<T>(options: {
    maxRetries?: number,
    minWaitIntervalMillis: number
    maxWaitIntervalMillis: number
}) {
    return retry<T>({
        count: options.maxRetries,
        resetOnSuccess: true,
        delay: (_error, retryTimes) => {
            const backoffTime = Math.min(
                Math.pow(2, retryTimes) * options.minWaitIntervalMillis,
                options.maxWaitIntervalMillis
            );
            return timer(backoffTime);
        }
    });
}