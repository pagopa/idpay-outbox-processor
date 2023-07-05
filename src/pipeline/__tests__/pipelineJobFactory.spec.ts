import { Pipe } from "stream";
import { PipelineJob } from "../pipelineJob";
import { OutboxMessage, SourceConnector } from "../../source/sourceConnector";
import { Publisher } from "../../publisher/publisher";
import { Logger } from "@nestjs/common";
import { sleep } from "../../utils";
import { PipelineFactory } from "../pipelineFactory";

describe("The pipeline factory", () => {

    let mockSource: SourceConnector
    let mockPublisher: Publisher

    beforeEach(() => {
        jest.clearAllMocks();
        mockSource = { } as SourceConnector
        mockPublisher = {
            send: jest.fn().mockImplementation((message) => Promise.resolve(message))
        };
    });

    afterEach(() => {
    });

    it("create a full document pipeline", async () => {
        const mockSource = {} as SourceConnector;
        const mockPublisher = {} as Publisher;

        const job = await PipelineFactory.fromConfig({
            name: "pipeline",
            type: "full"
        }, mockSource, mockPublisher);

        expect(job).not.toBeUndefined();
    })
    

    it("fails to create unsupported pipeline", async () => {
        const mockSource = {} as SourceConnector;
        const mockPublisher = {} as Publisher;

        const job = PipelineFactory.fromConfig({
            name: "pipeline",
            type: "not_supported"
        } as any, mockSource, mockPublisher);

        expect(job).rejects.toBeTruthy();
    })
});