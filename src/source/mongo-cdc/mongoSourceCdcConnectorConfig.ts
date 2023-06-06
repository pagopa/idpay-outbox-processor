import mongoose from "mongoose";
import {SourceInfoRepository} from "./sourceInfo";
import {SaveCheckpointPolicy} from "./saveCheckpointPolicy";

/**
 * idleTimeoutMillis: milliseconds to wait when there is no change document
 */
export interface MongoSourceCdcConnectorConfig {
    checkpointKey: string,
    checkpointRepository?: SourceInfoRepository
    saveCheckpointPolicy?: SaveCheckpointPolicy,
    idleTimeoutMillis?: number
    aggregationPipeline?: mongoose.mongo.BSON.Document[]
}