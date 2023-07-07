import { Controller, Get } from "@nestjs/common";
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    MongooseHealthIndicator,
} from "@nestjs/terminus";
import { MongoSourceCdcConnector } from "../source/mongo-cdc/mongoSourceCdcConnector";

@Controller("health")
export class HealthController {

    constructor(
        private healthCheck: HealthCheckService,
        private mongoHealthIndicator: MongooseHealthIndicator,
        private source: MongoSourceCdcConnector,
    ) {
    }

    @Get()
    @HealthCheck()
    async check(): Promise<HealthCheckResult> {
        return this.healthCheck.check([
            () => this.mongoHealthIndicator.pingCheck('source', {
                connection: this.source.connection
            })
        ]);
    }
}