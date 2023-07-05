import { GenericContainer, StartedTestContainer, Wait, Network } from "testcontainers"

export async function starMongoWithReplicaSet(): Promise<StartedTestContainer> {
    const container = await new GenericContainer("mongo:4.2")
        .withExposedPorts(27017)
        .withNetworkAliases("mongodb")
        .withEnvironment({
            MONGO_INITDB_DATABASE: "test-db",
            MONGO_REPLICA_SET_NAME: "rs0"
        })
        .withCommand(["--bind_ip_all", "--replSet", "rs0"])
        .withWaitStrategy(Wait.forLogMessage(/.*waiting for connections/, 1))
        .start();

    await initializeReplicaSet(container, 5);
    return container;
}

async function initializeReplicaSet(container: StartedTestContainer, maxAttempts: number) {
    if ((await container.exec(["mongo", "--eval", "rs.initiate()"])).exitCode == 0) {
        // wait for status ok
        let isReady: boolean;
        do {
            isReady = Number.parseInt((await container.exec(["mongo", "--quiet", "--eval", "rs.status().ok"])).output) == 1
            maxAttempts = isReady ? maxAttempts : maxAttempts - 1
        } while(maxAttempts > 0 && !isReady);
    }
}