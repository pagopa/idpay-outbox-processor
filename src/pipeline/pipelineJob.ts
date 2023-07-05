import { Publisher } from "../publisher/publisher";
import { OutboxMessage, SourceConnector } from "../source/sourceConnector";
import { StatisticsMonitor } from "../statisticsMonitor";
import { from, lastValueFrom, map, mergeMap, of, tap } from "rxjs";
import { retryWithBackoff } from "../source/rxExtension";
import { Logger } from "@nestjs/common";
import { PipelineStage } from "./pipelineStage";

/**
 * PipelineJob represent a job which consume message from source, 
 * applies some transformations stage (optionally) and then publish it through a publisher.
 */
export class PipelineJob {

    private readonly statisticMonitor: StatisticsMonitor

    private jobId: NodeJS.Immediate | undefined = undefined;
    
    constructor(
        private readonly source: SourceConnector,
        private readonly publisher: Publisher,
        private readonly stages: PipelineStage[],
        private readonly logger: Logger
    ) {
        this.statisticMonitor = new StatisticsMonitor(60_000);
    }

    start() {
        this.statisticMonitor.start();
        this.logger.log("Started");
        if(!this.jobId) {
            this.jobId = setImmediate(() => this.doJob());
        }
    }

    stop() {
        if (this.jobId) {
            clearImmediate(this.jobId);
            this.jobId = undefined;
          }
        this.statisticMonitor.stop();
    }

    private async doJob() {
        await this.pollAndProcess();
        // Schedule the next iteration if the loop is still active
        if (this.jobId) {
            this.jobId = setImmediate(() => this.doJob());
        }
    }

    private async pollAndProcess() {
        return this.source.next()
            .then(elementOrNull => {
                if (elementOrNull != undefined) {
                    return Promise.resolve(elementOrNull!)
                        .then(element => this.applyStages(element))
                        .then(element => this.publishWithRetries(element))
                        .then(element => this.commitWithRetries(element))
                        //x.then(_ => this.statisticMonitor.increaseConsumedMessage())
                        .then(_ => this.logger.log(`Message processed`))
                } else {
                    return Promise.resolve(undefined)
                }
            })
            .catch(error => this.logger.error(error));
    }

    // Applies transformation stage if specified
    private applyStages(message: OutboxMessage): Promise<OutboxMessage> {
        return this.stages.reduce<Promise<OutboxMessage>>(
            (accumulator, current) => accumulator.then(m => typeof current === "function" ? current(m) : current.apply(m)),
            Promise.resolve(message)
        );
    }

    private publishWithRetries(message: OutboxMessage): Promise<OutboxMessage> {
        return lastValueFrom(of(message).pipe(
            mergeMap(message => this.publisher.send(message)),
            tap({ error: error => this.logger.warn("Failed to publish, retrying...", error) }),
            retryWithBackoff({
                minWaitIntervalMillis: 100,
                maxWaitIntervalMillis: 5000
            })
        ));
    }

    private commitWithRetries(message: OutboxMessage): Promise<OutboxMessage> {
        return lastValueFrom(of(message).pipe(
            mergeMap(message => this.source.commit(message)),
            tap({ error: error => this.logger.warn("Failed to commit, retrying...", error) }),
            retryWithBackoff({
                minWaitIntervalMillis: 100,
                maxWaitIntervalMillis: 5000
            })
        ));
    }
}