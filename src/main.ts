import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        autoFlushLogs: true,
    });
    await app.listen(3000);
}

bootstrap()
    .catch((reason) => {
        console.log(`Failed to boostrap`)
        console.log(reason)
    })