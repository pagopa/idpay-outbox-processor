import mongoose from "mongoose";
import {SourceInfoRepository} from "./sourceInfo";
import {ResumeTokenSavePolicy} from "./resumeTokenSavePolicy";

/**
 * idleTimeoutMillis: milliseconds to wait when there is no change document
 */
export interface MongoSourceCdcConnectorConfig {
    idleTimeoutMillis?: number
    checkpointConfig?: ResumeTokenSavePolicyConfig
    aggregationPipeline?: mongoose.mongo.BSON.Document[]
}

export interface ResumeTokenSavePolicyConfig {
    resumeTokenSavePolicy: ResumeTokenSavePolicy
    resumeTokenRepository: SourceInfoRepository
}