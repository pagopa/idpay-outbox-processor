import { Inject, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { appConfig } from './config';
import { PipelineConfig, PipelineFactory } from './pipeline/pipelineFactory';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/healthController';
import { MongoSourceCdcConnectorFactory } from './source/mongo-cdc/mongoSourceCdcConnectorFactory';
import { KafkaPublisher } from './publisher/kafkaPublisher';
import { LogPublisher } from './publisher/logPublisher';
import { PipelineJob } from './pipeline/pipelineJob';
import { MongoSourceCdcConnector } from './source/mongo-cdc/mongoSourceCdcConnector';
import { Publisher } from './publisher/publisher';

@Module({
    imports: [
        TerminusModule,
    ],
    controllers: [
        HealthController
    ],
    providers: [
        {
            provide: MongoSourceCdcConnector,
            useFactory: async () => {
                return await MongoSourceCdcConnectorFactory.fromConfig({
                    uri: appConfig.mongoDbUri,
                    dbName: appConfig.mongoDbName,
                    collectionName: appConfig.outboxCollectionName,
                    aggregationPipeline: [
                        { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
                        { $project: { _id: 1, fullDocument: 1, ns: 1, documentKey: 1 } },
                    ],
                });
            },
        },
        {
            provide: 'Publisher',
            useFactory: () => {
                return appConfig.kafkaConfig ? KafkaPublisher.fromConfig({
                    broker: appConfig.kafkaConfig.broker,
                    topic: appConfig.kafkaConfig.topic,
                    sasl_jaas: appConfig.kafkaConfig.saslJaas
                }) : new LogPublisher()
            }
        }
    ]
})
export class AppModule implements OnApplicationBootstrap, OnApplicationShutdown {

    private pipeline?: PipelineJob

    constructor(
        @Inject(MongoSourceCdcConnector) private readonly source: MongoSourceCdcConnector,
        @Inject('Publisher') private readonly publisher: Publisher
    ) {
    }

    async onApplicationBootstrap() {
        // pipeline job
        const pipelineConfig: PipelineConfig = { name: "defaultPipeline", type: "full" }
        PipelineFactory.fromConfig(pipelineConfig, this.source, this.publisher)
            .then(job => {
                this.pipeline = job;
                job.start();
            })
            .catch(error => Logger.error(error));
    }

    onApplicationShutdown(signal?: string | undefined) {
        // graceful shutdown
        if (signal == "SIGTERM") {
            this.pipeline?.stop();
        }
    }
}