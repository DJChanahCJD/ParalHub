import { Global, Module } from '@nestjs/common';
import { CommonProvider } from '../provider/common/common.provider';
import { CommonOptionsController } from '../controller/common.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Skill,
  Industry,
  SkillSchema,
  IndustrySchema,
  Tag,
  TagSchema,
} from '../schema/common.schema';
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Skill.name, schema: SkillSchema },
      { name: Industry.name, schema: IndustrySchema },
      { name: Tag.name, schema: TagSchema },
    ]),
  ],
  providers: [CommonProvider],
  exports: [CommonProvider],
  controllers: [CommonOptionsController],
})
export class CommonModule {}
