export interface BaseCommentDto {
  content: string;
  articleId: string;
  userId?: string;
}

export interface CreateCommentDto extends BaseCommentDto {
  type: 'comment';
}

export interface CreateReplyDto extends BaseCommentDto {
  type: 'reply';
  parentId: string;
  replyToId: string;
  replyToUserId: string;
}
