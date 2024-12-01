import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { NoticeProvider } from 'src/provider/notice/notice.provider';
import { Notice } from 'src/schema/notice.schema';
import { AuthService } from '@/module/auth/auth.service';
import { Types } from 'mongoose';
import { NoticeQuery } from 'src/dto/pagination';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';
import { JwtPayload } from '@/types/auth.types';
import { Public } from '@/decorators/public.decorator';

@Controller('notice')
@UseGuards(JwtAuthGuard)
export class NoticeController {
  constructor(
    private readonly noticeProvider: NoticeProvider,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async create(
    @Body() createNoticeDto: Partial<Notice>,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const payload = user;

      if (!payload.userId) {
        throw new BadRequestException('User ID is missing');
      }

      return this.noticeProvider.create({
        ...createNoticeDto,
        creatorId: new Types.ObjectId(payload.userId),
        status: 'draft', // 默认为草稿状态
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create notice');
    }
  }

  @Get()
  @Public()
  async findAll(
    @Query() query: NoticeQuery,
  ): Promise<{ data: Partial<Notice>[]; total: number }> {
    const result = await this.noticeProvider.findAll(query);
    return {
      data: result.items,
      total: result.total,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNoticeDto: Partial<Notice>,
  ) {
    return this.noticeProvider.update(id, updateNoticeDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.noticeProvider.delete(id);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    return this.noticeProvider.publish(id);
  }

  @Post(':id/withdraw')
  async withdraw(@Param('id') id: string) {
    return this.noticeProvider.withdraw(id);
  }
}
