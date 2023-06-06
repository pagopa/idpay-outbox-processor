import { NestFactory } from "@nestjs/core";
import { getConfiguration } from "./config/index";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        autoFlushLogs: true,
    });
    await app.listen(3000);
}

getConfiguration()
    .then(_ => bootstrap())
    .catch((reason) => {
        console.log(`Failed to boostrap`)
        console.log(reason)
    })