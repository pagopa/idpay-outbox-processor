import { Pipe } from "stream";
import { PipelineJob } from "../pipelineJob";
import { OutboxMessage, SourceConnector } from "../../source/sourceConnector";
import { Publisher } from "../../publisher/publisher";
import { Logger } from "@nestjs/common";
import { sleep } from "../../utils";

jest.createMockFromModule("../../source/sourceConnector")

describe("A pipeline job", () => {

    let mockSource: SourceConnector
    let mockPublisher: Publisher

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = {
            next: jest.fn(),
            close: jest.fn().mockReturnValue(Promise.resolve()),
            commit: jest.fn().mockImplementation((message) => Promise.resolve(message))
        };
        mockPublisher = {
            send: jest.fn().mockImplementation((message) => Promise.resolve(message))
        };
    });

    it("publish and commit message", async () => {
        const exampleOutboxMessage = new OutboxMessage("rootKey", "key", "value", undefined);
        const pipelineJob = new PipelineJob(mockSource, mockPublisher, [], new Logger());

        const nextMessage = jest.spyOn(mockSource, 'next').mockResolvedValue(exampleOutboxMessage);

        await pipelineJob.start();
        await new Promise(setImmediate);
        await pipelineJob.stop();

        expect(nextMessage).toHaveBeenCalled();
        expect(mockPublisher.send).toHaveBeenCalledWith(exampleOutboxMessage);
        expect(mockSource.commit).toHaveBeenCalledWith(exampleOutboxMessage);
    });

    it("applies stages", async () => {
        const exampleOutboxMessage = new OutboxMessage("rootKey", "key", "value");
        const stage = (message: OutboxMessage) => Promise.resolve(new OutboxMessage(message.rootKey, message.key, "stage"));
        const pipelineJob = new PipelineJob(mockSource, mockPublisher, [stage], new Logger());
        const nextMessage = jest.spyOn(mockSource, 'next').mockResolvedValue(exampleOutboxMessage);

        await pipelineJob.start();
        await new Promise(setImmediate);
        await pipelineJob.stop();

        expect(nextMessage).toHaveBeenCalled();
        expect(mockPublisher.send).toHaveBeenCalledWith(expect.objectContaining({ value: "stage" }));
    });

    it("when fails to publish or commit retries until succedeed", async () => {
        const messages = [
            new OutboxMessage("rootKey1", "key1", "value1"),
            new OutboxMessage("rootKey2", "key2", "value2")
        ];
        jest.spyOn(mockSource, 'next')
            .mockResolvedValueOnce(messages[0]) // Return the first message
            .mockResolvedValue(messages[1]); // Return the second message

        const failPublish = jest.spyOn(mockPublisher, 'send')
            .mockRejectedValueOnce("Failed to publish")
            .mockRejectedValueOnce("Failed to publish")
            .mockResolvedValueOnce(messages[0])
            .mockResolvedValueOnce(messages[1]);

        const failCommit = jest.spyOn(mockSource, 'commit')
            .mockRejectedValueOnce("Failed to commit")
            .mockRejectedValueOnce("Failed to commit")
            .mockResolvedValueOnce(messages[0])
            .mockResolvedValueOnce(messages[1]);

        const pipelineJob = new PipelineJob(mockSource, mockPublisher, [], new Logger());
        pipelineJob.start();
        await sleep(2000);
        pipelineJob.stop();

        expect(failPublish).toHaveBeenNthCalledWith(3, messages[0]);
        expect(failPublish).toHaveBeenNthCalledWith(4, messages[1]);

        expect(failCommit).toHaveBeenNthCalledWith(3, messages[0]);
        expect(failCommit).toHaveBeenNthCalledWith(4, messages[1]);
    });
});