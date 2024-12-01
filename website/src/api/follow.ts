import api from '@/lib/axios';
import { FollowQuery } from '@/types/follow';

export const getFollowing = (userId: string, params: FollowQuery) =>
  api.get(`/follows/following/${userId}`, { params });

export const getFollowers = (userId: string, params: FollowQuery)=>
  api.get(`/follows/followers/${userId}`, { params });

export const followUser = (userId: string, followingRole: string) =>
  api.post(`/follows/${userId}/follow`, { followingRole });

export const unfollowUser = (userId: string, followingRole: string) =>
  api.delete(`/follows/${userId}/unfollow`, { data: { followingRole } });

export const checkFollowing = (userId: string) =>
  api.get(`/follows/${userId}/checkFollowing`);
