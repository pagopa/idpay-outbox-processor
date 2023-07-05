import {Controller, Get} from "@nestjs/common";
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    MicroserviceHealthIndicator,
    MongooseHealthIndicator
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {

    constructor(
        private healthCheck: HealthCheckService,
        private mongooseHealth: MongooseHealthIndicator,
        private microserviceHealth: MicroserviceHealthIndicator
    ) {
    }


    @Get()
    @HealthCheck()
    async check(): Promise<HealthCheckResult> {
        return this.healthCheck.check(
            [
                () => this.mongooseHealth.pingCheck("sourceDB"),
                () => this.mongooseHealth.pingCheck("checkpointConnection"),
            ],
        );
    }
}