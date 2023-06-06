import { Publisher } from "../publisher/publisher";
import {OutboxMessage, SourceConnector} from "../source/sourceConnector";
import { StatisticsMonitor } from "../statisticsMonitor";
import { from, lastValueFrom, map, tap } from "rxjs";
import { retryWithBackoff } from "../source/rxExtension";
import { Logger } from "@nestjs/common";
import { Middleware } from "./middleware";


export class PipelineJob {

    private readonly statisticMonitor: StatisticsMonitor
    
    private isActive: boolean = false;

    constructor(
        private readonly source: SourceConnector,
        private readonly publisher: Publisher,
        private readonly stages: Middleware[],
        private readonly logger: Logger
    ) {
        this.statisticMonitor = new StatisticsMonitor(60_000);
    }

    async start() {
        this.statisticMonitor.start();
        this.isActive = true;

        this.logger.log("Started");
        while (this.isActive) {
            await this.source.next()
                .then(element => this.applyStages(element))
                .then(element => this.publisher.send(element))
                .then(element => this.source.commit(element))
                .then(_ => this.statisticMonitor.increaseConsumedMessage())
                .then(_ => this.logger.log(`Message processed`))
                .catch(error => this.logger.error(error));
        }
    }

    async stop() {
        this.isActive = false;
    }

    private applyStages(message: OutboxMessage): Promise<OutboxMessage> {
        const stagesResult = this.stages.reduce<Promise<OutboxMessage>>(
            (accumulator, current) => accumulator.then(m => typeof current === "function" ? current(m) : current.apply(m)),
            Promise.resolve(message)
         );
        return lastValueFrom(from(stagesResult).pipe(
            tap({error: error => this.logger.warn("Failed to process pipeline, retrying...", error)}),
            retryWithBackoff({
                minWaitIntervalMillis: 100,
                maxWaitIntervalMillis: 5000
            })
        ));
    }
}