import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommonProvider } from '../provider/common/common.provider';
import { Skill, Industry, Tag } from '../schema/common.schema';
import {
  IndustryListParams,
  SkillListParams,
  TagListParams,
} from 'src/types/common';
import { Public } from '@/decorators/public.decorator';
import { JwtAuthGuard } from '@/guards/auth.guard';
@Controller('/common')
@UseGuards(JwtAuthGuard)
export class CommonOptionsController {
  constructor(private readonly commonProvider: CommonProvider) {}
  @Public()
  @Get('/skills/all')
  async getAllSkills() {
    return this.commonProvider.getAllSkills();
  }

  @Public()
  @Get('/skills')
  async getSkillOptions(@Query() params: SkillListParams) {
    return this.commonProvider.getSkillOptions(params);
  }

  @Public()
  @Get('/industries/all')
  async getAllIndustries() {
    return this.commonProvider.getAllIndustries();
  }

  @Public()
  @Get('/industries')
  async getIndustryOptions(@Query() params: IndustryListParams) {
    return this.commonProvider.getIndustryOptions(params);
  }

  @Public()
  @Get('/tags/all')
  async getAllTags() {
    return this.commonProvider.getAllTags();
  }

  @Public()
  @Get('/tags')
  async getTagOptions(@Query() params: TagListParams) {
    return this.commonProvider.getTagOptions(params);
  }

  @Post('/skills')
  async createSkill(@Body() skill: Skill) {
    return this.commonProvider.createSkill(skill);
  }

  @Put('/skills/:id')
  async updateSkill(@Param('id') id: string, @Body() skill: Skill) {
    return this.commonProvider.updateSkill(id, skill);
  }

  @Delete('/skills/:id')
  async deleteSkill(@Param('id') id: string) {
    return this.commonProvider.deleteSkill(id);
  }

  @Post('/industries')
  async createIndustry(@Body() industry: Industry) {
    return this.commonProvider.createIndustry(industry);
  }

  @Put('/industries/:id')
  async updateIndustry(@Param('id') id: string, @Body() industry: Industry) {
    return this.commonProvider.updateIndustry(id, industry);
  }

  @Delete('/industries/:id')
  async deleteIndustry(@Param('id') id: string) {
    return this.commonProvider.deleteIndustry(id);
  }

  @Post('/tags')
  async createTag(@Body() tag: Tag) {
    return this.commonProvider.createTag(tag);
  }

  @Put('/tags/:id')
  async updateTag(@Param('id') id: string, @Body() tag: Tag) {
    return this.commonProvider.updateTag(id, tag);
  }

  @Delete('/tags/:id')
  async deleteTag(@Param('id') id: string) {
    return this.commonProvider.deleteTag(id);
  }
}
