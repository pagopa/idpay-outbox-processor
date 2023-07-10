import { ClientKafka } from "@nestjs/microservices";
import { KafkaPublisher } from "../kafkaPublisher";
import { EMPTY, of } from "rxjs";
import { OutboxMessage } from "../../source/sourceConnector";


describe("A kafka publisher", () => {

    const testTopic = "test-topic";

    let mockClient: ClientKafka;
    let kafkaPublisher: KafkaPublisher;

    beforeEach(() => {
        mockClient = jest.mocked(new ClientKafka({}));
        jest.spyOn(mockClient, 'connect').mockResolvedValue(undefined as any);
        kafkaPublisher = new KafkaPublisher(mockClient, testTopic);
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    it("publish partitioned message by key", async () => {
        const emitSpy = jest.spyOn(mockClient, 'emit').mockImplementation((_, data) => of(data));
        const message = new OutboxMessage("rootKey", "key", {});

        await expect(kafkaPublisher.send(message)).resolves.toEqual(message);
        expect(emitSpy).toHaveBeenCalledWith(
            testTopic,
            {
                value: JSON.stringify(message.value),
                key: message.key
            }
        );
    });

    it("should fail if kakfa fail", async () => {
        jest.spyOn(mockClient, 'emit').mockImplementation((_, __) => EMPTY);
        const message = new OutboxMessage("rootKey", "key", {});

        await expect(kafkaPublisher.send(message)).rejects.toBeTruthy();
    });
});