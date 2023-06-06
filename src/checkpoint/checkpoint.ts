export class Checkpoint{
    constructor(
        public readonly key: String,
        public readonly value: String
    ) {
    }
}

export interface CheckpointRepository {
    save(checkpoint: Checkpoint): Promise<Checkpoint>;
    findByKey(key: String): Promise<Checkpoint | undefined>;
}