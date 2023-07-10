import { ClientKafka, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { OutboxMessage } from "../source/sourceConnector";
import { Publisher } from "./publisher";
import { Partitioners } from "kafkajs";
import { DocumentFormatter, simplifiedFormatter } from "./jsonFormatter";

/**
 * Publisher configuration. Actually only kafka is supported
 */
export interface KafkaPublisherConfig {
    formatter: DocumentFormatter,
    topic: string,
    broker: string,
    sasl_jaas: string | undefined
}

/**
 * A kafka publisher which implements pipeline publisher interface.
 */
export class KafkaPublisher implements Publisher {

    static fromConfig(config: KafkaPublisherConfig) {
        const clientProxy = createKafkaClientNestJS(config.broker, config.sasl_jaas);
        return new KafkaPublisher(clientProxy, config.topic, config.formatter);
    }

    private connectPromise;

    constructor(
        private readonly kafka: ClientKafka,
        private readonly topic: string,
        private readonly formatter: DocumentFormatter = simplifiedFormatter,
        private readonly logger: Logger = new Logger(KafkaPublisher.name),
        private readonly formatter: DocumentFormatter = simplifiedFormatter
    ) {
        this.connectPromise = kafka.connect().then(_ => Logger.log("Connected to broker")).catch(error => Logger.error(error));
    }

    async send(message: OutboxMessage): Promise<OutboxMessage> {
        await this.connectPromise;
        const payload = this.formatter(message.value);
        this.logger.log(`Send evento to kafka for document ${JSON.stringify(message.key)}`);
        return lastValueFrom(this.kafka.emit(this.topic, {
            value: payload,
            key: message.key
        })).then(_ => message);
    }
}

function createKafkaClientNestJS(broker: string, sasl_jaas?: string) {
    return ClientProxyFactory.create({
        transport: Transport.KAFKA,
        options: {
            producerOnlyMode: true,
            client: {
                brokers: [broker],
                sasl: sasl_jaas ? {
                    mechanism: "plain",
                    username: "$ConnectionString",
                    password: sasl_jaas
                } : undefined
            },
            producer: {
                createPartitioner: Partitioners.DefaultPartitioner
            }
        },
    }) as ClientKafka;
}