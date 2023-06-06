import {Module} from '@nestjs/common';
import {ProcessorModule} from "./modules/processor.module";


@Module({
    imports: [ ProcessorModule ],
})
export class AppModule {}