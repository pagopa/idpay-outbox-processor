import { Partitioners } from "kafkajs";
import { Publisher } from "./publisher";
import { ClientKafka, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { KafkaMiddlewarePublisher } from "./kafka/kafkaMiddlewarePublisher";
import { Logger } from "@nestjs/common";

export interface PublisherConfig {
    type: 'kafka',
    topic: string,
    config: {
        broker: string,
        sasl_jaas: string
    }
}

export namespace PublisherFactory {

    export async function fromConfig(config: PublisherConfig): Promise<Publisher> {
        switch (config.type) {
            case 'kafka':
                const clientProxy = ClientProxyFactory.create({
                    transport: Transport.KAFKA,
                    options: {
                        producerOnlyMode: true,
                        client: {
                            brokers: [config.config.broker],
                            sasl: config.config.sasl_jaas ? {
                                mechanism: "plain",
                                username: "$ConnectionString",
                                password: config.config.sasl_jaas!
                            } : undefined
                        },
                        producer: {
                            createPartitioner: Partitioners.DefaultPartitioner
                        }
                    },
                }) as ClientKafka;
                await clientProxy.connect().then(_ => Logger.log("Connected to broker")).catch(error => Logger.error(error));
                return new KafkaMiddlewarePublisher(clientProxy, config.topic);
            default:
                return Promise.reject("Invalid publisher config");
        }
    }

}