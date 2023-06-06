import {map, mergeMap, Observable, Subscription, tap} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {Observables, retryWithBackoff} from "./rxExtension";
import {OutboxMessagePublisher} from "./output/outboxMessagePublisher";
import {OutboxConsumer, OutboxMessage} from "./consumer/outboxConsumer";
import {Logger} from "@nestjs/common";

export interface OutboxProcessorOptions {
    backoffSettings?: {
        minWaitIntervalMillis: number,
        maxWaitIntervalMillis: number
    }
}

export class OutboxProcessor {
    private subscription: Subscription | undefined = undefined;
    private readonly logger: Logger = new Logger(OutboxProcessor.name)

    constructor(
        private outboxConsumer: OutboxConsumer,
        private outputMessageStream: OutboxMessagePublisher,
        private readonly options: OutboxProcessorOptions = {
            backoffSettings: {
                minWaitIntervalMillis: 100,
                maxWaitIntervalMillis: 5000
            }
        }
    ) {
    }

    async start() {
        this.subscription = Observables.fromOutboxConsumer(this.outboxConsumer)
            .pipe(
                mergeMap(message => this.handleWithOutputStream(message)),
                mergeMap(message => this.outboxConsumer.commit(message))
            ).subscribe({
                next: message => this.logger.log(`Message processed`),
                error: error => this.logger.error(error)
            });
    }

    async stop() {
        this.subscription?.unsubscribe();
    }

    private handleWithOutputStream(message: OutboxMessage): Observable<OutboxMessage> {
        return fromPromise(this.outputMessageStream(message)).pipe(
            map(() => message),
            tap({error: error => this.logger.warn("Failed to output message, retrying...", error)}),
            retryWithBackoff(this.options.backoffSettings!)
        )
    }
}