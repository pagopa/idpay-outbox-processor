export class SourceInfo{
    constructor(
        public readonly collectionName: String,
        public readonly resumeToken: String
    ) {
    }
}

export interface SourceInfoRepository {
    save(sourceInfo: SourceInfo): Promise<SourceInfo>;
    findByKey(collectionName: String): Promise<SourceInfo | undefined>;
}

export class FileSourceInfoRepo implements SourceInfoRepository {

    constructor(
        private readonly sourceInfo?: SourceInfo
    ) {}

    save(sourceInfo: SourceInfo): Promise<SourceInfo> {
        console.log(JSON.stringify(sourceInfo));
        return Promise.resolve(sourceInfo);
    }

    findByKey(collectionName: String): Promise<SourceInfo | undefined> {
       return Promise.resolve(this.sourceInfo);
    }
}