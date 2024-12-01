import { PaginationParams } from './pagination';
// import { User } from './user';

export interface FollowQuery extends PaginationParams {
  role?: 'admin' | 'developer' | 'enterprise';
  username?: string;
}

// export interface FollowResponse {
//   data: Array<{
//     _id: string;
//     user: User;
//     createdAt: string;
//     isFollowing: boolean;
//   }>;
//   total: number;
//   hasMore: boolean;
// }
