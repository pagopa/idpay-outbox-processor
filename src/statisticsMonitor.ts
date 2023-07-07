import { Logger } from "@nestjs/common";

export class StatisticsMonitor {

    private startTime = 0;
    private totalElapsedTime = 0;
    private throughput = 0;

    // circular buffer for latest X message delays
    private messageDelays: number[] = [0];
    private nextMessageDelayIndex = 0;
    private messageDelayWindow = 10;
    private lastProcessTime: number | undefined

    private metricsJob?: NodeJS.Timer = undefined;

    constructor(
        private readonly measureIntervalMillis: number
    ) {
        this.lastProcessTime = undefined;
        Logger.debug(`Measuring throughput using sampling rate of ${measureIntervalMillis}ms`, "PERFORMANCE");
    }

    start() {
        this.startTime = performance.now();
        this.metricsJob = setInterval(() => {
            const throughput = this.throughput / this.measureIntervalMillis / 1000;
            this.throughput = 0;
            this.startTime = performance.now();

            const averageDelay = this.messageDelays.reduce((acc, value) => acc + value) / this.messageDelays.length;

            Logger.debug(`Estimated throughput: ${throughput.toFixed(2)} msg/s`, "PERFORMANCE");
            Logger.debug(`Average message delays ${averageDelay.toFixed(2)} ms`, "PERFORMANCE");
        }, this.measureIntervalMillis);
    }

    stop() {
        if (this.metricsJob) {
            clearInterval(this.metricsJob);
        }
    }

    increaseConsumedMessage() {
        const now = performance.now();
        this.throughput += 1;
        if (this.lastProcessTime) {
            const newDelay = now - this.lastProcessTime;
            this.messageDelays[this.nextMessageDelayIndex] = newDelay;
            this.nextMessageDelayIndex = this.nextMessageDelayIndex + 1 % this.messageDelayWindow;
        }
        this.lastProcessTime = now;
    }

}