import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { appConfig } from "./config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        autoFlushLogs: true,
        logger: [appConfig.logLevel]
    });
    app.enableShutdownHooks();
    await app.listen(3000);
}

bootstrap()
    .catch((reason) => {
        console.log(`Failed to boostrap`)
        console.log(reason)
    })