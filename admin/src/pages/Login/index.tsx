import { Footer } from '@/components';
import { getCaptchaByEmail, loginByPassword, loginByCaptcha } from '@/services/paral-hub/api';
import {
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { FormattedMessage, history, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, Tabs } from 'antd';
import Settings from '../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')" ,
      backgroundSize: '100% 100%',
    },
    main: {
      flex: 1,
      padding: '32px 0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    card: {
      width: '100%',
      maxWidth: '480px',
      padding: '32px 40px',
      borderRadius: '8px',
      boxShadow: token.boxShadow
    },
    divider: {
      position: 'relative',
      textAlign: 'center',
      margin: '24px 0',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: '1px',
        backgroundColor: token.colorBorder,
        zIndex: 1
      },
      '& span': {
        position: 'relative',
        padding: '0 16px',
        color: token.colorTextSecondary,
        backgroundColor: token.colorBgContainer,
        fontSize: '14px',
        zIndex: 2
      }
    }
  };
});

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

type LoginType = 'password' | 'captcha';

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [type, setType] = useState<LoginType>('password');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.() || {};
    userInfo.avatar = userInfo.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=default';
    if (userInfo) {
      console.log('userInfo:', userInfo);
      flushSync(async () => {
        await setInitialState(s => ({
          ...s,
          currentUser: userInfo,
        }));
        console.log('FetchUserInfo Updated currentUser:', initialState?.currentUser);
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    let msg;
    try {

      if (type === 'password') {
        console.log('loginByPassword:', values);
        msg = await loginByPassword(values);
      } else if (type === 'captcha') {
        console.log('loginByCaptcha:', values);
        msg = await loginByCaptcha(values);
      }

      if (msg?.status === 'success') {
        localStorage.setItem('token', msg.token || '');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        message.success('登录成功');
        return;
      }
      message.error('登录失败');
    } catch (error) {
      message.error('登录失败，请重试！');
    }
    setUserLoginState(msg || {});
  };
  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="ParalHub"
          subTitle={intl.formatMessage({ id: 'pages.layouts.userLayout.title'})}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            console.log('loginForm values:', values);
            await handleSubmit(values as API.LoginParams);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={(value) => setType(value as LoginType)}
            centered
            items={[
              {
                key: 'password',
                label: intl.formatMessage({
                  id: 'pages.login.passwordLogin.tab',
                  defaultMessage: '账户密码登录',
                }),
              },
              {
                key: 'captcha',
                label: intl.formatMessage({
                  id: 'pages.login.captchaLogin.tab',
                  defaultMessage: '验证码登录',
                }),
              },
            ]}
          />

          {status === 'error' && loginType === 'password' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.passwordLogin.errorMessage',
                defaultMessage: '账户或密码错误',
              })}
            />
          )}
          {type === 'password' && (
            <>
              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <MailOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.email.placeholder',
                  defaultMessage: '邮箱',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.email.required"
                        defaultMessage="请输入邮箱!"
                      />
                    ),
                  },
                  {
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: (
                      <FormattedMessage
                        id="pages.login.email.invalid"
                        defaultMessage="邮箱格式错误！"
                      />
                    ),
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                  defaultMessage: '密码',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.password.required"
                        defaultMessage="请输入密码！"
                      />
                    ),
                  },
                ]}
              />
            </>
          )}

          {status === 'error' && loginType === 'captcha' && <LoginMessage content="验证码错误" />}
          {type === 'captcha' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MailOutlined />
                }}
                name="email"
                placeholder={intl.formatMessage({
                  id: 'pages.login.email.placeholder',
                  defaultMessage: '邮箱',
                })}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.email.required"
                        defaultMessage="请输入邮箱！"
                      />
                    ),
                  },
                  {
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: (
                      <FormattedMessage
                        id="pages.login.email.invalid"
                        defaultMessage="邮箱格式错误！"
                      />
                    ),
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                name="captcha"
                phoneName="email"
                captchaProps={{
                  size: 'large',
                }}
                placeholder={intl.formatMessage({
                  id: 'pages.login.captcha.placeholder',
                  defaultMessage: '请输入验证码',
                })}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} ${intl.formatMessage({
                      id: 'pages.getCaptchaSecondText',
                      defaultMessage: '获取验证码',
                    })}`;
                  }
                  return intl.formatMessage({
                    id: 'pages.login.email.getVerificationCode',
                    defaultMessage: '获取验证码',
                  });
                }}
                rules={[
                  {
                    required: true,
                    message: (
                      <FormattedMessage
                        id="pages.login.captcha.required"
                        defaultMessage="请输入验证码！"
                      />
                    ),
                  },
                ]}
                onGetCaptcha={async (email) => {
                  const result = await getCaptchaByEmail({
                    email,
                  });
                  if (!result) {
                    return;
                  }
                  message.success(`${result.message}`);
                }}
              />
            </>
          )}
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
            >
              <FormattedMessage id="pages.login.forgotPassword" defaultMessage="忘记密码" />
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
