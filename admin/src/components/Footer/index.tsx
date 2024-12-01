import { DefaultFooter } from '@ant-design/pro-components';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[
        {
          key: 'ParalHub',
          title: (
            <Tooltip
              title={
                <div style={{ fontSize: '13px', padding: '4px' }}>
                  <p style={{ margin: '0 0 4px 0' }}>
                    首次登录将自动成为超级管理员
                  </p>
                  <p style={{ margin: 0 }}>
                    请使用安全的邮箱和密码
                  </p>
                </div>
              }
              placement="top"
            >
              <QuestionCircleOutlined
                style={{
                  marginRight: 4,
                  color: 'rgba(0, 0, 0, 0.45)',
                }}
              />
              ParalHub
            </Tooltip>
          ),
          href: 'https://paralhub.com',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
