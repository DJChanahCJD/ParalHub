import { JwtPayload } from '../../types/auth.types';
import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../schema/users.schema';
import { CurrentUser } from '../../decorators/user.decorator';
import { FollowQuery } from '../../dto/pagination';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { FollowProvider } from '../../provider/follow/follow.provider';

@Controller('follows')
export class FollowController {
  constructor(private readonly followProvider: FollowProvider) {}

  private roleToCollection(role: UserRole) {
    return role.toString().toLowerCase() + '_users';
  }

  // 获取关注列表
  @Get('following/:userId')
  @UseGuards(JwtAuthGuard)
  async getFollowing(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: FollowQuery,
  ) {
    if (userId !== user.userId) {
      throw new ForbiddenException('无权限访问');
    }
    const { username, current = 1, pageSize = 10 } = query;
    const userCollection = this.roleToCollection(user.role);

    return this.followProvider.getFollowing(
      userId,
      userCollection,
      Number(current),
      Number(pageSize),
      username,
    );
  }

  // 获取粉丝列表
  @Get('followers/:userId')
  @UseGuards(JwtAuthGuard)
  async getFollowers(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: FollowQuery,
  ) {
    if (userId !== user.userId) {
      throw new ForbiddenException('无权限访问');
    }
    const {
      username,
      current = 1,
      pageSize = 10,
      sortField,
      sortOrder,
    } = query;
    const userCollection = this.roleToCollection(user.role);

    return this.followProvider.getFollowers(
      userId,
      userCollection,
      Number(current),
      Number(pageSize),
      username,
      sortField,
      sortOrder,
    );
  }

  // 关注用户
  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  async follow(
    @Param('userId') followingId: string,
    @CurrentUser() user: JwtPayload,
    @Body('followingRole') followingRole: UserRole,
  ) {
    const { userId: followerId, role: followerRole } = user;
    const followerCollection = this.roleToCollection(followerRole);
    const followingCollection = this.roleToCollection(followingRole);
    return this.followProvider.follow(
      followerId,
      followerCollection,
      followingId,
      followingCollection,
    );
  }

  @Get(':userId/isFollowing/:followingId')
  @UseGuards(JwtAuthGuard)
  async isFollowing(
    @Param('userId') userId: string,
    @Param('followingId') followingId: string,
  ) {
    return this.followProvider.isFollowing(userId, followingId);
  }

  @Get(':userId/checkFollowing')
  @UseGuards(JwtAuthGuard)
  async checkFollowing(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.followProvider.isFollowing(user.userId, userId);
  }

  // 取消关注
  @Delete(':userId/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Param('userId') followingId: string,
    @CurrentUser() user: JwtPayload,
    @Body('followingRole') followingRole: UserRole,
  ) {
    const { userId: followerId, role: followerRole } = user;
    const followerCollection = this.roleToCollection(followerRole);
    const followingCollection = this.roleToCollection(followingRole);
    return this.followProvider.unfollow(
      followerId,
      followerCollection,
      followingId,
      followingCollection,
    );
  }
}
