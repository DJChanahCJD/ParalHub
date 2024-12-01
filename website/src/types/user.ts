export interface User {
  _id: string
  email: string
  username: string
  realName?: string
  password?: string
  role: UserRole
  bio?: string
  company?: string
  location?: string
  website?: string
  skills?: string[]
  avatar?: string
  starIds?: string[]
  followerCount?: number
  followingCount?: number
  verificationStatus?: 'verified' | 'pending' | 'rejected'
  likedArticleIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export enum UserRole {
  DEVELOPER = 'developer',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}