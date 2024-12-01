export const emailTemplate = {
  captcha: (code: string, expireMinute: number) => `
    <div style="
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: #2c3e50;
    ">
      <div style="
        text-align: center;
        margin-bottom: 30px;
      ">
        <h1 style="
          margin: 0;
          font-size: 24px;
          font-weight: 500;
          color: #1a1a1a;
        ">ParalHub</h1>
      </div>

      <div style="
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        padding: 30px;
        text-align: center;
      ">
        <p style="
          margin: 0 0 20px;
          font-size: 15px;
          color: #666;
        ">您的验证码是</p>

        <div style="
          font-size: 32px;
          font-weight: 500;
          letter-spacing: 8px;
          color: #2b85e4;
          margin: 20px 0;
          font-family: monospace;
        ">${code}</div>

        <p style="
          margin: 20px 0 0;
          font-size: 13px;
          color: #999;
        ">验证码 ${expireMinute} 分钟内有效</p>
      </div>

      <div style="
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      ">
        这是一封自动生成的邮件，无需回复
      </div>
    </div>
  `,
};
