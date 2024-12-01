/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    username?: string;
    avatar?: string;
    _id?: string;
    email?: string;
    access?: string;
    phone?: string;
    userType?: string;
    lastLogin?: Date;
    createdAt?: Date;
  };

  type LoginResult = {
    data?: CurrentUser;
    status?: string;
    type?: string;
    currentAuthority?: string;
    token?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend' | null;
    [key: string]: any;
  };

  type UserItem = {
    _id: string;
    username: string;
    email: string;
    bio?: string;
    lastLogin?: string;
    createdAt: string;
    phone?: string;
    website?: string;
  };

  type AdminItem = UserItem & {
    access: 'super_admin' | 'admin';
  };

  type DeveloperItem = UserItem & {
    realName?: string;
    skills?: string[];
    bio?: string;
  };

  type EnterpriseItem = UserItem & {
    company?: string;
    industry?: string;
    scale?: 'small' | 'medium' | 'large';
    contactPerson?: string;
    address?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    caseCount: number;
  };

  type Captcha = {
    code?: number;
    status?: string;
    message?: string;
  };

  type LoginParams = {
    email: string;
    password?: string;
    captcha?: string;
    autoLogin?: boolean;
  };

  type SkillItem = {
    _id: string;
    name: string;
  };

  type IndustryItem = {
    _id: string;
    name: string;
  };

  type TagItem = {
    _id: string;
    name: string;
  };

  type CommentItem = {
    _id: string;
    content: string;
    author?: string;
    createdAt: string;
    type: 'comment' | 'reply' | 'all';
    replyCount?: number;
    likes?: number;
    articleId?: {
      _id: string;
      title: string;
    };
    userId?: {
      _id: string;
      username: string;
      avatar: string;
      role: string;
    };
  };

  // Case 类型定义
interface CaseItem {
  _id: string;
  title: string;
  description: string;
  content: string;
  stars: number;
  tags: string[];
  authorId?: {
    _id: string;
    username: string;
    avatar: string;
  };
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 分页参数类型
interface CaseParams {
  page?: number;
  pageSize?: number;
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  authorId?: string;
  sortField?: string;
  sortOrder?: 'descend' | 'ascend';
}

// API 响应类型
interface CaseResponse {
  items: CaseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  type CaseItem = {
    _id: string;
    title: string;
    description?: string;
    content?: string;
    stars?: number;
    tags?: string[];
    authorId: string;
    createdAt: string;
    updatedAt?: string;
  };

  type UserInfo = {
    _id: string;
    username: string;
    email: string;
    access?: string;
    avatar?: string;
    phone?: string;
    userType?: string;
    lastLogin?: Date;
    createdAt: Date;
  };

  interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';
    message: string;
    context: string;
    metadata: Record<string, any>;
    source?: string;
    repeatCount?: number;
  }

  interface LogResponse {
    code: number;
    data: {
      data: LogEntry[];
      hasMore: boolean;
      nextCursor: string | null;
      total: number;
      type: string;
    };
    message?: string;
    error?: string;
  }

  type SkillListParams = {
    current?: number;
    pageSize?: number;
    name?: string;
    updatedAt?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  };

  type IndustryListParams = {
    current?: number;
    pageSize?: number;
    name?: string;
    updatedAt?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  };

  type TagListParams = {
    current?: number;
    pageSize?: number;
    name?: string;
    updatedAt?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  };

  interface PageResult<T> {
    data: T[];
    total: number;
    pageSize: number;
    current: number;
    success: boolean;
  }

  interface ArticleItem {
    _id: string;
    title: string;
    content: string;
    caseId?: {  // populate 后的案例信息
      _id: string;
      title: string;
    };
    authorId?: {  // populate 后的作者信息
      _id: string;
      username: string;
      avatar: string;
    };
    tags: string[];
    likes: number;
    comments: number;
    createdAt: string;
    updatedAt: string;
  }

  // 分页请求参数
  interface ArticleParams {
    current?: number;
    pageSize?: number;
    title?: string;
    caseId?: string;
    authorId?: string;
    tags?: string[];
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  }

  // 分页响应结构
  interface ArticleResponse {
    items: ArticleItem[];
    total: number;
    success: boolean;
  }

  interface NoticeParams {
    current?: number;
    pageSize?: number;
    title: string;
    content: string;
    status: string;
    type: 'system' | 'announcement' | 'notification';
    publishTime?: string;
    expireTime?: string;
    target?: 'all' | 'developer' | 'enterprise';
    username?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  }

  interface NoticeItem {
    _id: string;
    title: string;
    content: string;
    status: string;
    type: 'system' | 'announcement' | 'notification';
    publishTime: string;
    expireTime: string;
    target: 'all' | 'developer' | 'enterprise';
    creator?: {
      _id: string;
      username: string;
      avatar: string;
    };
    creatorId?: {
      _id: string;
      username: string;
      avatar: string;
    };
  }

  interface NoticeResponse {
    items?: NoticeItem[];
    data?: NoticeItem[];
    total: number;
    success: boolean;
  }

  // 用户日志条目类型
  interface UserLogEntry {
    timestamp: string;
    event: string;
    address: string;
    ip: string;
    success: boolean;
    message?: string;
    metadata?: {
      userId?: string;
      username?: string;
      details?: any;
    };
  }

  // 用户日志响应类型
  interface UserLogResponse {
    code: number;
    data: {
      data: UserLogEntry[];
      total: number;
      success: boolean;
    };
    message?: string;
  }

  // 用户日志请求参数类型
  interface UserLogParams {
    current?: number;
    pageSize?: number;
    event?: string;
    success?: boolean;
    ip?: string;
    address?: string;
    type?: string;
    keyword?: string;
    sortField?: string;
    sortOrder?: 'ascend' | 'descend';
  }
}
