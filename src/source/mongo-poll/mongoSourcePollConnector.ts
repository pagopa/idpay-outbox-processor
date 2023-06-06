import mongoose, { Collection, FilterQuery } from "mongoose";
import { OutboxMessage, SourceConnector } from "../sourceConnector";
import { sleep } from "../../utils";
import { Logger } from "@nestjs/common";

export interface MongoSourcePollConnectorConfig {
    refreshTimeoutMillise?: number
    batchSize: number
    query: mongoose.mongo.Filter<Document>
}

export class MongoSourcePollConnector implements SourceConnector {

    private lastCursor: mongoose.mongo.FindCursor<mongoose.mongo.WithId<mongoose.mongo.BSON.Document>> | undefined

    constructor(
        readonly collection: Collection,
        private readonly config: MongoSourcePollConnectorConfig
    ) {}

    async next(): Promise<OutboxMessage> {
        let next = await this.tryNext();
        while (next == undefined) {
            await sleep(this.config?.refreshTimeoutMillise ?? 1000);
            next = await this.tryNext();
        }
        Logger.log("Polled " + next);
        return next;
    }

    async tryNext(): Promise<OutboxMessage | undefined> {
        const hasNext = await (this.lastCursor?.hasNext() ?? Promise.resolve(false));
        if (!hasNext) {
            console.log("Create new cursor")
            this.lastCursor?.close();
            this.lastCursor = this.collection.find(this.config.query).batchSize(this.config.batchSize);
        }

        const document = await this.lastCursor?.tryNext();
        if (document) {
            return new OutboxMessage(
                document._id,
                document._id,
                document,
                undefined
            );
        }
        return undefined;
    }
    
    async close(): Promise<void> {
        await this.lastCursor?.close();
    }

    commit(message: OutboxMessage): Promise<any> {
        return Promise.resolve(message);
    }

}