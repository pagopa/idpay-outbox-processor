import {DynamicModule, Inject, Logger, Module, OnApplicationBootstrap} from "@nestjs/common";
import {ClientKafka, ClientsModule, Transport} from "@nestjs/microservices";
import { KafkaConfig } from "@nestjs/microservices/external/kafka.interface";
import { KafkaOutboxMessagePublisher } from "../processor/output/impl/kafkaOutboxMessagePublisher";

export type KafkaPublishOptions = {
    config: KafkaConfig | undefined
    topic: string
}

@Module({})
export class KafkaPublisherModule implements OnApplicationBootstrap {

    static register(options: KafkaPublishOptions): DynamicModule {
        return {
            module: KafkaPublisherModule,
            imports: [
                ClientsModule.register([
                    {
                        name: 'KAFKA_PUBLISHER',
                        transport: Transport.KAFKA,
                        options: {
                            producerOnlyMode: true,
                            client: options.config
                        },
                    },
                ]),
            ],
            providers: [
                {
                    provide: "MessagePublisher",
                    useFactory: (clientKafka: ClientKafka) => 
                        new KafkaOutboxMessagePublisher(clientKafka, options.topic).publisher(),
                    inject: ['KAFKA_PUBLISHER']
                }
            ],
            exports: ["MessagePublisher"]
        }
    }

    constructor(
        @Inject('KAFKA_PUBLISHER') private readonly publisher: ClientKafka
    ) {}

    onApplicationBootstrap() {
        this.publisher.connect()
        .then(_ => Logger.log("Connect to kafka"))
        .catch(err => Logger.error("Failed to connect to kafka", err));
    }
}