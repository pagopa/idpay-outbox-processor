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

    constructor(
        private readonly measureIntervalMillis: number
    ) {
        this.lastProcessTime = undefined;
        Logger.debug(`Measuring throughput using sampling rate of ${measureIntervalMillis}ms`, "PERFORMANCE");
    }

    start() {
        this.startTime = performance.now();
        setInterval(() => {
            const throughput = this.throughput / this.totalElapsedTime;
            this.throughput = 0;
            this.startTime = performance.now();

            const averageDelay = this.messageDelays.reduce((acc, value) => acc + value) / this.messageDelays.length;

            Logger.debug(`Estimated throughput: ${throughput.toFixed(2)} msg/s`, "PERFORMANCE");
            Logger.debug(`Average message delays ${averageDelay.toFixed(2)} ms`, "PERFORMANCE");
        }, this.measureIntervalMillis);
    }

    increaseConsumedMessage() {
        const now = performance.now();
        this.throughput += 1;
        this.totalElapsedTime = (now - this.startTime) / 1000; // Convert to seconds
        if (this.lastProcessTime) {
            const newDelay = now - this.lastProcessTime;
            this.messageDelays[this.nextMessageDelayIndex] = newDelay;
            this.nextMessageDelayIndex = this.nextMessageDelayIndex + 1 % this.messageDelayWindow;
        }
        this.lastProcessTime = now;
    }

}