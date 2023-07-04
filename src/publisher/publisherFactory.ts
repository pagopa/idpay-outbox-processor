import { Partitioners } from "kafkajs";
import { Publisher } from "./publisher";
import { ClientKafka, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { KafkaPublisher } from "./kafka/kafkaMiddlewarePublisher";
import { Logger } from "@nestjs/common";
import { OutboxMessage } from "../source/sourceConnector";

/**
 * Publisher configuration. Actually only kafka is supported
 */
export interface PublisherConfig {
    type: 'kafka',
    config: {
        topic: string,
        broker: string,
        sasl_jaas: string | undefined
    }
}

/**
 * Factory to create a publisher starting from publisher configuration
 */
export namespace PublisherFactory {

    export async function fromConfig(config: PublisherConfig): Promise<Publisher> {
        switch (config.type) {
            case 'kafka':
                const clientProxy = createKafkaClientNestJS(config.config.broker, config.config.sasl_jaas)
                await clientProxy.connect().then(_ => Logger.log("Connected to broker")).catch(error => Logger.error(error));
                return new KafkaPublisher(clientProxy, config.config.topic);
            default:
                return Promise.reject("Invalid publisher config");
        }
    }

    export function logOnly(logger: Logger = new Logger("FakePublisher")): Publisher {
        return {
            send(message: OutboxMessage): Promise<OutboxMessage> {
                logger.log("Fake publish event: " + JSON.stringify(message));
                return Promise.resolve(message);
            },
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
                        password: sasl_jaas!
                    } : undefined
                },
                producer: {
                    createPartitioner: Partitioners.DefaultPartitioner
                }
            },
        }) as ClientKafka;
    }
}