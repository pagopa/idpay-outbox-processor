import * as mongoose from "mongoose";
import {AnyObject, Collection} from "mongoose";
import {Logger} from "@nestjs/common";
import {OutboxMessage, SourceConnector} from "../sourceConnector";
import {MongoSourceCdcConnectorConfig} from "./mongoSourceCdcConnectorConfig";
import {SourceInfo} from "./sourceInfo";
import {sleep} from "../../utils";

const defaultConfig: MongoSourceCdcConnectorConfig = {
    aggregationPipeline: [{$match: {operationType: "insert"}}],
    idleTimeoutMillis: 1000,
    checkpointConfig: undefined
}

export class MongoSourceCdcConnector implements SourceConnector {

    private static INVALID_CHANGE_STREAM_ERRORS = new Set([
        260,    // INVALIDATED_RESUME_TOKEN_ERROR
        280,    // CHANGE_STREAM_FATAL_ERROR
        286,    // CHANGE_STREAM_HISTORY_LOST
        9,      // INVALID_RESUME_TOKEN_ERROR
    ]);

    private cursor?: mongoose.mongo.ChangeStream<any, any>;
    private messagesFromLastCommit: number = 0;
    private isCheckpointSaveEnabled;
    private isIdle;

    constructor(
        private readonly options: MongoSourceCdcConnectorConfig = defaultConfig,
        readonly collection: Collection<AnyObject>
    ) {
        this.isCheckpointSaveEnabled = options.checkpointConfig?.resumeTokenSavePolicy != undefined
        this.isIdle = false;
    }

    public get connection() : mongoose.Connection {
        return this.collection.conn;
    }

    async next(): Promise<OutboxMessage | undefined> {
        if (this.isIdle) {
            await sleep(this.options?.idleTimeoutMillis ?? 1000);
        }
        let next = await this.tryGetNext();
        this.isIdle = next == undefined;
        return next;
    }

    commit(message: OutboxMessage): Promise<any> {
        if (this.isCheckpointSaveEnabled) {
            const shouldSave = this.options.checkpointConfig?.resumeTokenSavePolicy?.call(this, this.messagesFromLastCommit + 1, message);

            if (shouldSave && message.source) {
                return this.options.checkpointConfig!.resumeTokenRepository.save(message.source)
                    .then(_ => this.messagesFromLastCommit = 0)
                    .then(_ => message);
            } else if (!message.source) {
                Logger.warn("No checkpoint for message, could lead to message duplication")
            }
        }
        return Promise.resolve(message);
    }

    async close(): Promise<void> {
        try {
            await this.cursor?.close();
        } catch (e) {
            Logger.warn("Error during cursor close", e);
        }
        this.cursor = undefined;
    }

    private async tryGetNext(): Promise<OutboxMessage | undefined> {
        try {
            this.cursor = await this.getOrCreateCursor();
            const change = await this.cursor.tryNext();
            if (change) {
                const resumeToken = (this.cursor.resumeToken as AnyObject);
                return new OutboxMessage(
                    change.documentKey._id,
                    change.documentKey._id,
                    change,
                    resumeToken && new SourceInfo(this.collection.name, resumeToken["_data"])
                );
            }
        } catch (e) {
            await this.handleNextError(e);
        }
    }

    private async handleNextError(e: any) {
        if (e instanceof mongoose.mongo.MongoError) {
            Logger.error("An error occurred when trying to get next item from stream", e);
            await this.close();
            const invalidStreamError = (e.code && e.code as number) ? MongoSourceCdcConnector.INVALID_CHANGE_STREAM_ERRORS.has(e.code as number) : false;
            if (invalidStreamError) {
                Logger.error("Invalid stream detected, recreating cursor...", e);
                await this.getOrCreateCursor();
            } else {
                Logger.error("Unhandled mongo error", e);
            }
        } else {
            Logger.error("An unknown error occurred when trying to get next item from stream", e);
        }
    }

    private async getOrCreateCursor(): Promise<mongoose.mongo.ChangeStream<any, any>> {
        if (this.cursor == undefined) {
            this.cursor = await this.createOrResumeStream();
        }
        return this.cursor;
    }

    // resume cdc stream
    private createOrResumeStream(): Promise<mongoose.mongo.ChangeStream<any, any>> {
        const tokenKey = this.collection.name;
        if (this.isCheckpointSaveEnabled) {
            Logger.log("Checkpoint repository enabled");
            return this.options.checkpointConfig!.resumeTokenRepository.findByKey(tokenKey)
                .then(checkpoint => {
                if (checkpoint) {
                    return this.collection.watch(this.options.aggregationPipeline, {
                        resumeAfter: { _data: checkpoint.resumeToken.toString() },
                        fullDocument: "updateLookup",
                    });
                } else {
                    Logger.warn(`No checkpoint found for given key ${tokenKey}`);
                    return this.collection.watch(this.options.aggregationPipeline, {fullDocument: "updateLookup"});
                }
            });
        } else {
            Logger.warn("Checkpoint disabled, will not save a resume checkpoint");
            return Promise.resolve(this.collection.watch(this.options.aggregationPipeline, {fullDocument: "updateLookup"}));
        }
    }
}