export interface CaseResponse {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  status: string;
  // ... 其他必要字段
}
