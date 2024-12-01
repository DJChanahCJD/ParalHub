import { Global, Module } from '@nestjs/common';
import { CommonProvider } from 'src/provider/common/common.provider';
import { CommonOptionsController } from 'src/controller/common.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Skill,
  Industry,
  SkillSchema,
  IndustrySchema,
  Tag,
  TagSchema,
} from 'src/schema/common.schema';
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
