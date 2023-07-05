import { StartedTestContainer } from "testcontainers"
import { MongoSourceCdcConnector } from "../src/source/mongo-cdc/mongoSourceCdcConnector";
import { starMongoWithReplicaSet } from "./integrationUtils";
import mongoose, { Connection, createConnection } from "mongoose";
import { SourceInfo, SourceInfoRepository } from "../src/source/mongo-cdc/sourceInfo";
import { ResumeTokenSavePolicy } from "../src/source/mongo-cdc/resumeTokenSavePolicy";
import { MongoSourceCdcConnectorFactory } from "../src/source/mongo-cdc/mongoSourceCdcConnectorFactory";
import { Publisher } from "../src/publisher/publisher";
import { createFullDocumentPipeline } from "../src/pipeline/fullDocumentPipeline";
import { OutboxMessage } from "../src/source/sourceConnector";
import { PipelineJob } from "../src/pipeline/pipelineJob";
import { sleep } from "../src/utils";

describe("Mongo CDC Source", () => {
    let container: StartedTestContainer
    let connectionString: string
    let source: MongoSourceCdcConnector
    let mockTokenRepository: SourceInfoRepository

    afterEach(async () => {
        jest.clearAllMocks();
    })


    it("should get next updated document", async () => {
        const insertDocument = { _id: new mongoose.Types.ObjectId(), key: "key1", value: "value1" }
        await expect(source.next()).resolves.toBeFalsy();
        await expect(source.collection.insertOne(insertDocument)).resolves.toEqual(expect.objectContaining({acknowledged: true}));
        await expect(source.next()).resolves.toMatchObject({
            rootKey: insertDocument._id,
            key: insertDocument._id,
            value: {
                fullDocument: {
                    _id: insertDocument._id,
                    key: insertDocument.key,
                    value: insertDocument.value
                }
            }
        });
    })

    it("must commit by saving resume token", async () => {
        const insertDocument = { _id: new mongoose.Types.ObjectId(), key: "key1", value: "value1" }
        const mockSaveToken = jest.spyOn(mockTokenRepository, 'save').mockImplementation(info => Promise.resolve(info));

        await expect(source.next()).resolves.toBeFalsy();
        await expect(source.collection.insertOne(insertDocument)).resolves.toEqual(expect.objectContaining({acknowledged: true}));
        const message = await source.next();
        expect(message).toBeTruthy();
        await expect(source.commit(message!)).resolves.toBeTruthy();
        expect(mockSaveToken).toBeCalledTimes(1);
    })

    it("must resume from existing token", async() => {
        let token: SourceInfo | undefined
        const insertDocument = { _id: new mongoose.Types.ObjectId(), key: "key1", value: "value1" }
        
        jest.spyOn(mockTokenRepository, 'save').mockImplementation(info => Promise.resolve(token = info));
        jest.spyOn(mockTokenRepository, 'findByKey').mockImplementation((_) => Promise.resolve(token));
        
        await expect(source.next()).resolves.toBeFalsy();
        await expect(source.collection.insertOne(insertDocument)).resolves.toEqual(expect.objectContaining({acknowledged: true}));
        await expect(source.next().then(it => source.commit(it!))).resolves.toBeTruthy(); // commit to save token
        await source.close();

        const afterTokenDocument = { _id: new mongoose.Types.ObjectId(), key: "keyAfter", value: "valueAfter" }
        await expect(source.next()).resolves.toBeTruthy();
        await expect(source.collection.insertOne(afterTokenDocument)).resolves.toEqual(expect.objectContaining({acknowledged: true}));
        await expect(source.next()).resolves.toMatchObject({
            rootKey: afterTokenDocument._id,
            key: afterTokenDocument._id,
            value: {
                fullDocument: {
                    _id: afterTokenDocument._id,
                    key: afterTokenDocument.key,
                    value: afterTokenDocument.value
                }
            }
        });
    })

    describe("with full document pipline", () => {
        let publisher: Publisher;
        let pipeline: PipelineJob
        beforeEach(() => {
            publisher = {
                send: jest.fn().mockImplementation(m => Promise.resolve(m))
            };
            pipeline = createFullDocumentPipeline("test", source, publisher);
        });

        afterEach(async () => {
            pipeline?.stop();
        })

        it("must publish full document", async () => {
            const insertDocument = { _id: new mongoose.Types.ObjectId(), content1: "value1", content2: "value2" }
            pipeline.start();
            await expect(source.collection.insertOne(insertDocument)).resolves.toEqual(expect.objectContaining({acknowledged: true}));
            await sleep(1000);
            await expect(publisher.send).toHaveBeenCalledWith(expect.objectContaining({
                rootKey: insertDocument._id,
                key: insertDocument._id,
                value: expect.objectContaining( {
                    _id: insertDocument._id,
                    content1: 'value1',
                    content2: 'value2' 
                })
            }));
        });
    });

    // setup and teardown a mongo db with replica set (mandatory for oplog watch)
    beforeAll(async () => { 
        container = await starMongoWithReplicaSet() 
        connectionString = "mongodb://127.0.0.1:" + container.getMappedPort(27017);
        mockTokenRepository = {
            findByKey: jest.fn().mockResolvedValue(undefined),
            save: jest.fn().mockImplementation(m => Promise.resolve(m)),
        };
        source = await MongoSourceCdcConnectorFactory.fromConfig({
            uri: connectionString,
            dbName: "test-db",
            collectionName: "test",
            idleTimeoutMillis: 100,
            aggregationPipeline: [
                { $match: { operationType: { $in: ["insert", "update", "replace"] } } },
                { $project: { _id: 1, fullDocument: 1, ns: 1, documentKey: 1 } },
            ],
            checkpointRepository: mockTokenRepository,
        });
    }, 60_000);

    afterAll(async () => {
        await source?.close();
        await source.connection.close();
        await container?.stop();
    });
});
