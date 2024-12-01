import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { getArticles } from '@/services/paral-hub/article';
import { getComments } from '@/services/paral-hub/comment';

interface CommentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: API.CommentItem) => Promise<void>;
  initialValues?: Partial<API.CommentItem>;
  title: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  open,
  onOpenChange,
  onFinish,
  initialValues,
  title,
}) => {
  const [form] = Form.useForm();

  return (
    <ModalForm
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      initialValues={initialValues}
      onFinish={async (values) => {
        await onFinish(values);
        return true;
      }}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        width: 600,
      }}
    >
      <ProFormSelect
        name="articleId"
        label="关联文章"
        rules={[{ required: true, message: '请选择关联文章' }]}
        request={async () => {
          const { items } = await getArticles({ pageSize: 999 });
          return items.map(item => ({
            label: item.title,
            value: item._id,
            searchTerms: [item.title, item.content].filter(Boolean).join(' '),
          }));
        }}
        fieldProps={{
          showSearch: true,
          placeholder: '请选择关联文章',
          filterOption: (input: string, option: any) => {
            if (!option) return false;
            const searchText = input.toLowerCase();
            const label = String(option.label).toLowerCase();
            const searchTerms = option.searchTerms?.toLowerCase() || '';
            return label.includes(searchText) || searchTerms.includes(searchText);
          },
        }}
      />

      <ProFormTextArea
        name="content"
        label="评论内容"
        fieldProps={{
          rows: 4,
        }}
        rules={[
          { required: true, message: '请输入评论内容' },
          { max: 500, message: '评论内容最多500个字符' },
        ]}
      />

      <ProFormSelect
        name="type"
        label="评论类型"
        rules={[{ required: true, message: '请选择评论类型' }]}
        options={[
          { label: '主评论', value: 'comment' },
          { label: '回复', value: 'reply' },
        ]}
      />

      {/* 如果是回复类型，显示额外的字段 */}
      <Form.Item noStyle shouldUpdate={(prevValues, currentValues) =>
        prevValues.type !== currentValues.type
      }>
        {({ getFieldValue }) =>
          getFieldValue('type') === 'reply' ? (
            <>
              <ProFormSelect
                name="parentId"
                label="回复的主评论"
                rules={[{ required: true, message: '请选择要回复的主评论' }]}
                request={async () => {
                  const articleId = form.getFieldValue('articleId');
                  if (!articleId) return [];
                  const response = await getComments({
                    pageSize: 999,
                    type: 'comment',
                    'articleId._id': articleId,
                  });
                  return response.items.map((item: API.CommentItem) => ({
                    label: item.content,
                    value: item._id,
                  }));
                }}
                dependencies={['articleId']}
              />

              <ProFormSelect
                name="replyToId"
                label="回复目标评论"
                rules={[{ required: true, message: '请选择要回复的评论' }]}
                request={async () => {
                  const parentId = form.getFieldValue('parentId');
                  if (!parentId) return [];
                  const response = await getComments({
                    pageSize: 999,
                    parentId,
                  });
                  return [
                    { label: '回复主评论', value: parentId },
                    ...response.items.map((item: API.CommentItem) => ({
                      label: item.content,
                      value: item._id,
                    })),
                  ];
                }}
                dependencies={['parentId']}
              />
            </>
          ) : null
        }
      </Form.Item>
    </ModalForm>
  );
};

export default CommentForm;
