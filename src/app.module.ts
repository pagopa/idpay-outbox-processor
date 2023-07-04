import { Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { appConfig } from './config';
import { SourceConnectorFactory } from './source/sourceConnectorFactory';
import { PublisherFactory } from './publisher/publisherFactory';
import { PipelineConfig, PipelineFactory } from './pipeline/pipelineFactory';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/healthController';

@Module({
    imports: [
        TerminusModule,
    ],
    controllers: [
        HealthController
    ]
})
export class AppModule implements OnApplicationBootstrap, OnApplicationShutdown {

    constructor(
        private readonly healthController: HealthController
    ) {}

    async onApplicationBootstrap() {
        const source = await SourceConnectorFactory.fromConfig({
            type: "cdc",
            config: {
                uri: appConfig.mongoDbUri,
                dbName: appConfig.mongoDbName,
                collectionName: appConfig.outboxCollectionName,
                aggregationPipeline: [
                    { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
                    { $project: { _id: 1, fullDocument: 1, ns: 1, documentKey: 1 } },
                ],
            }
        });

        const publisher = appConfig.kafkaConfig ? await PublisherFactory.fromConfig({
            type: "kafka",
            config: {
                broker: appConfig.kafkaConfig.broker,
                topic: appConfig.kafkaConfig.topic,
                sasl_jaas: appConfig.kafkaConfig.saslJaas
            }
        }) : PublisherFactory.logOnly();

        // pipeline job
        const pipelineConfig: PipelineConfig = { name: "defaultPipeline", type: "full" }
        PipelineFactory.fromConfig(pipelineConfig, source, publisher)
            .then(job => job.start())
            .catch(error => Logger.error(error));
    }

    onApplicationShutdown(signal?: string | undefined) {
        throw new Error('Method not implemented.');
    }
}