import {Inject, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown} from "@nestjs/common";
import {MONGO_DB_URI, OUTBOX_COLLECTION_NAME, OUTBOX_KAFKA_BROKER, OUTBOX_KAFKA_TOPIC} from "../constants";
import {CheckpointModule} from "./checkpoint.module";
import {OutboxProcessor} from "../processor/outboxProcessor";
import { InjectConnection, MongooseModule } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { CheckpointRepository } from "../checkpoint/checkpoint";
import { OutboxMessagePublisher } from "../processor/output/outboxMessagePublisher";
import { MongoCdcOutboxConsumer } from "../processor/consumer/impl/mongoCdcOutboxConsumer";
import { saveCheckpointEvery } from "../processor/saveCheckpointPolicy";
import { KafkaPublisherModule } from "./kakfa.module";

@Module({
    imports: [
        KafkaPublisherModule.register({
            config: {
                brokers: [ OUTBOX_KAFKA_BROKER ],
                // sasl: {
                //     mechanism: "plain",
                //     username: "$ConnectionString",
                //     password: "<kafka_connection_string>"
                // },
                // ssl: true
            },
            topic: OUTBOX_KAFKA_TOPIC
        }),
        MongooseModule.forRoot(MONGO_DB_URI, { directConnection: true }),
        CheckpointModule.register(false),
    ],
    providers: [],
    controllers: [],
})
export class ProcessorModule implements OnApplicationBootstrap, OnApplicationShutdown {

    private outboxProcessor!: OutboxProcessor;

    constructor(
        @InjectConnection() private readonly connection: Connection,
        @Inject("CheckpointRepository") private readonly checkpointRepository: CheckpointRepository,
        @Inject("MessagePublisher") private readonly outboxMessagePublisher: OutboxMessagePublisher
    ) {
    }

    onApplicationBootstrap(): any {
        Logger.log("Initializing change stream");
        const outboxItems = this.connection.collection(OUTBOX_COLLECTION_NAME);

        this.outboxProcessor = new OutboxProcessor(
            new MongoCdcOutboxConsumer({
                checkpointKey: outboxItems.name,
                deleteCommittedDocument: false,
                checkpointRepository: this.checkpointRepository,
                saveCheckpointPolicy: saveCheckpointEvery(1),
                pipeline: [
                    { $match: { "operationType": { $in: ["insert", "update", "replace"] } } },
                    { $project: { "_id": 1, "fullDocument": 1, "ns": 1, "documentKey": 1 } }
                ]
            }, outboxItems),
            this.outboxMessagePublisher
        );
        this.outboxProcessor.start()
            .then(_ => Logger.log("Outbox started"))
            .catch(error => Logger.error(error));
    }

    async onApplicationShutdown(signal?: string | undefined) {
        if (this.outboxProcessor) {
            Logger.log("Stopping outbox processor");
            await this.outboxProcessor.stop();
        }
    }
}