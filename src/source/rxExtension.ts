import {fromAsyncIterable} from "rxjs/internal/observable/innerFrom";
import {BehaviorSubject, bufferToggle, connectable, delay, filter, interval, map, mergeMap, Observable, retry, share, Subject, take, takeWhile, tap, timer} from "rxjs";
import {OutboxMessage, SourceConnector} from "./sourceConnector";

export namespace Observables {
    export function fromSourceConnector(stream: SourceConnector) {
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

    export function fromSourceConnectorAsHot(stream: SourceConnector) {
        return connectable(
            Observables.fromSourceConnector(stream),
            { connector: () => new Subject<OutboxMessage>(), resetOnDisconnect: false }
        );
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