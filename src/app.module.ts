import { Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { getConfiguration } from './config';
import { MongoSourceConfig, SourceConnectorFactory } from './source/sourceConnectorFactory';
import { PublisherConfig, PublisherFactory } from './publisher/publisherFactory';
import { PipelineConfig, PipelineFactory } from './pipeline/pipelineFactory';


@Module({
    imports: [
        HealthModule,
    ]
})
export class AppModule implements OnApplicationBootstrap, OnApplicationShutdown {

    async onApplicationBootstrap() {
        const config = (await getConfiguration());
        const sourceConfig = config.source as MongoSourceConfig;
        const publisherConfig = config.publisher as PublisherConfig;
        const pipelineConfig = config.pipeline as PipelineConfig;

        const source = await SourceConnectorFactory.fromConfig(sourceConfig);
        const publisher = await PublisherFactory.fromConfig(publisherConfig);

        // pipeline job
        PipelineFactory.fromConfig(pipelineConfig, source, publisher)
            .then(job => job.start())
            .catch(error => Logger.error(error));
    }

    onApplicationShutdown(signal?: string | undefined) {
        throw new Error('Method not implemented.');
    }
}