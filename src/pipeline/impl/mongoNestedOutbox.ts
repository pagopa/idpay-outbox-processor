import mongoose, { Collection } from "mongoose";
import { OutboxMessage } from "../../source/sourceConnector";
import { fromArrayLike } from "rxjs/internal/observable/innerFrom";
import { from, lastValueFrom, map, mergeMap, tap, toArray } from "rxjs";
import { retryWithBackoff } from "../../source/rxExtension";
import { Logger } from "@nestjs/common";
import { Publisher } from "../../publisher/publisher";

export class MongoNestedOutboxPublisher implements Publisher {

    constructor(
        private publisher: Publisher,
        private collection: Collection
    ) {}

    async send(message: OutboxMessage): Promise<OutboxMessage> {
        const document = message.value as mongoose.mongo.Document | undefined;
        const events = document?.events as Array<any> | undefined
        if (events) {
            if (events.length > 0) {
                const observableScatter = fromArrayLike(events).pipe(
                    map(event => new OutboxMessage(message.rootKey, event.id, event, message.checkpoint)),
                    mergeMap(event => from(this.publisher.send(event)), 1),
                    tap({error: error => Logger.error("Failed to publish outbox event, retrying...", error)}),
                    retryWithBackoff({
                        minWaitIntervalMillis: 50,
                        maxWaitIntervalMillis: 500
                    }),
                    toArray(),
                    mergeMap(events => from(this.deleteOutboxPublished(events))),
                );
                
                const published = await lastValueFrom(observableScatter);
                Logger.log("Published " + published.length);
                return message;
            }
        }
        Logger.warn("Applying outbox mongo extractor to an invalid document, skipping it");
        return message;
    }
    
    private async deleteOutboxPublished(messages: OutboxMessage[]) {
        const ids = messages.map(it => it.key);
        if (messages.length > 0) {
            return await this.collection.updateOne(
                { _id: messages[0].rootKey }, 
                { $pull: { events: { id: { $in: ids } }} }
            ).then(ack => {
                return messages;
            });
        } else {
            return Promise.resolve(messages);
        }
    }
}