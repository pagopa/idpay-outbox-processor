import * as mongoose from "mongoose";
import {Checkpoint, CheckpointRepository} from "../../../checkpoint/checkpoint";
import {AnyObject, Collection} from "mongoose";
import {OutboxConsumer, OutboxMessage} from "../outboxConsumer";
import {SaveCheckpointPolicy} from "../../saveCheckpointPolicy";
import {Logger} from "@nestjs/common";

export interface CdcOutboxConsumerOptions {
    checkpointKey: string,
    checkpointRepository: CheckpointRepository
    saveCheckpointPolicy: SaveCheckpointPolicy,
    deleteCommittedDocument?: boolean
    pipeline?: mongoose.mongo.BSON.Document[]
}

export class MongoCdcOutboxConsumer implements OutboxConsumer {

    private changeStream!: mongoose.mongo.ChangeStream<any, any>;

    private readonly pipeline: mongoose.mongo.BSON.Document[] = []
    private committedMessages: number = 0;

    constructor(
        private readonly options: CdcOutboxConsumerOptions,
        private readonly collection: Collection<AnyObject>
    ) {
        this.pipeline = this.options.pipeline ?? [{$match: {operationType: "insert"}}]
    }

    async next(): Promise<OutboxMessage> {
        if (this.changeStream == undefined) {
            await this.createOrResumeStream();
        }
        const hasNext = await this.changeStream.hasNext();
        if (hasNext) {
            const payload = await this.changeStream.next();
            const resumeToken = (this.changeStream.resumeToken as AnyObject)["_data"];
            return new OutboxMessage(
                payload.documentKey,
                payload,
                new Checkpoint(this.collection.name, resumeToken)
            );
        } else {
            return Promise.reject("Failed to get next event change");
        }
    }

    async seekTo(checkpoint: Checkpoint): Promise<any> {
        if (this.changeStream) {
            await this.changeStream.close();
        }
        this.changeStream = this.collection.watch(this.pipeline, {
            resumeAfter: {_data: checkpoint.value.toString()},
            fullDocument: "updateLookup"
        });
    }

    commit(message: OutboxMessage): Promise<any> {
        const shouldSave = this.options.checkpointRepository && this.options.saveCheckpointPolicy(this.committedMessages + 1, message);
        const savePromise = shouldSave ?
            () => this.options.checkpointRepository.save(message.checkpoint).then(_ => this.committedMessages = 0) :
            () => Promise.resolve();
        const deletePromise: () => Promise<any> = this.options.deleteCommittedDocument ?
            () => this.collection.deleteOne({_id: message.id}) :
            () => Promise.resolve();

        return savePromise().then(_ => deletePromise())
            .then(_ => this.committedMessages += 1);
    }

    async close(): Promise<void> {
        await this.changeStream?.close();
    }

    // resume cdc stream
    private async createOrResumeStream() {
        if (this.options.checkpointRepository !== undefined) {
            Logger.log("Checkpoint repository enabled");
            return this.options.checkpointRepository.findByKey(this.options.checkpointKey)
                .then(checkpoint => {
                    if (checkpoint) {
                        return this.seekTo(checkpoint);
                    } else {
                        Logger.warn(`No checkpoint found for given key ${this.options.checkpointKey}`);
                        this.changeStream = this.collection.watch(this.pipeline, {fullDocument: "updateLookup"});
                    }
                });
        } else {
            this.changeStream = this.collection.watch(this.pipeline, {fullDocument: "updateLookup"});
            Logger.warn("Checkpoint disabled, will not save a resume checkpoint");
        }
    }
}