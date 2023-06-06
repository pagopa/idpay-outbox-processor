import {NestFactory} from '@nestjs/core';
import {AppModule} from "./app.module";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule, {
        autoFlushLogs: true,
    });
    await app.init();
}

bootstrap()
    .catch((reason) => {
        console.log(`Failed to boostrap`)
        console.log(reason)
    })