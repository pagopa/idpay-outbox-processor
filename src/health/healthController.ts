import {Controller, Get} from "@nestjs/common";
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {

    constructor(
        private healthCheck: HealthCheckService,
    ) {
    }


    @Get()
    @HealthCheck()
    async check(): Promise<HealthCheckResult> {
        return this.healthCheck.check([
            () => ({
                'app': {
                    status: 'up'
                }
            })
        ]);
    }
}