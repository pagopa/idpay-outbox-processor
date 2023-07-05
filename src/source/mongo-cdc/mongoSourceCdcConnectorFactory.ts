import { Connection, createConnection } from "mongoose";
import { MongoSourceCdcConnector } from "./mongoSourceCdcConnector";
import { SourceInfoRepository } from "./sourceInfo"
import { ResumeTokenSavePolicy } from "./resumeTokenSavePolicy";


export interface MongoSourceConfig {
    uri: string,
    dbName: string,
    collectionName: string,
    aggregationPipeline: any,
    idleTimeoutMillis?: number
    checkpoint?: {
        uri: string,
        checkPointEvery: number
    }
    checkpointRepository?: SourceInfoRepository
}

export namespace MongoSourceCdcConnectorFactory {
    export async function fromConfig(config: MongoSourceConfig): Promise<MongoSourceCdcConnector> {
        const mongoConnection = await createMongoConnection(config);
        const collection = mongoConnection.collection(config.collectionName);
        return new MongoSourceCdcConnector({
            aggregationPipeline: config.aggregationPipeline,
            idleTimeoutMillis: config.idleTimeoutMillis ?? 1000,
            checkpointConfig: config.checkpointRepository ? {
                resumeTokenRepository: config.checkpointRepository,
                resumeTokenSavePolicy: ResumeTokenSavePolicy.every(1)
            } : undefined,
        }, collection);
    }

    function createMongoConnection(config: MongoSourceConfig): Promise<Connection> {
        return createConnection(config.uri,
            {
                dbName: config.dbName,
                directConnection: true,
            }
        ).asPromise();
    }
}