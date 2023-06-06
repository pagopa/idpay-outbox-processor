import {fromAsyncIterable} from "rxjs/internal/observable/innerFrom";
import {retry, timer} from "rxjs";
import {OutboxConsumer, OutboxMessage} from "./consumer/outboxConsumer";

export namespace Observables {
    export function fromOutboxConsumer(stream: OutboxConsumer) {
        return fromAsyncIterable(new class implements AsyncIterable<OutboxMessage> {
            [Symbol.asyncIterator](): AsyncIterator<OutboxMessage> {
                return {
                    next() {
                        return stream.next().then(result => ({
                            value: result,
                            done: false
                        }));
                    },
                    return: () => Promise.resolve({value: undefined, done: true}),
                    throw: (error: any) => Promise.reject(error)
                }
            }
        });
    }
}

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


