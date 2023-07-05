

/**
 * Represente the source metadata. ResumeToken is used to resume the cdc stream
 */
export class SourceInfo {
    constructor(
        public readonly collectionName: string,
        public readonly resumeToken: string
    ) {
    }
}

/**
 * SourceInfo Repository interface, allows to save and get source info data.
 */
export interface SourceInfoRepository {
    save(sourceInfo: SourceInfo): Promise<SourceInfo>;
    findByKey(collectionName: string): Promise<SourceInfo | undefined>;
}