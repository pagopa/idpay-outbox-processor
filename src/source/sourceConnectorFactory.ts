import { Connection, createConnection } from "mongoose"
import { MongoSourceCdcConnector } from "./mongo-cdc/mongoSourceCdcConnector"
import { SourceConnector } from "./sourceConnector"

export interface MongoSourceConfig {
    type: 'cdc'
    config: {
        uri: string,
        dbName: string,
        collectionName: string,
        aggregationPipeline: any,
        checkpoint?: {
            uri: string,
            checkPointEvery: number
        }
    }
}

export namespace SourceConnectorFactory {
    export async function fromConfig(config: MongoSourceConfig): Promise<SourceConnector> {
        const mongoConnection = await createMongoConnection(config.config);
        const collection = mongoConnection.collection(config.config.collectionName);
        switch (config.type) {
            case "cdc":                
                return new MongoSourceCdcConnector({
                    aggregationPipeline: config.config.aggregationPipeline,
                    idleTimeoutMillis: 1000,
                    checkpointConfig: undefined
                }, collection);
            default:
                return Promise.reject("Invalid config")
        }
    }

   function createMongoConnection(config: MongoSourceConfig['config']): Promise<Connection> {
        return createConnection(config.uri,
            {
                dbName: config.dbName,
                directConnection: true,
            }
        ).asPromise();
    }
}