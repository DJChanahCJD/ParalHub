// @ts-nocheck
// This file is generated by Umi automatically
// DO NOT CHANGE IT MANUALLY!
import React from 'react';
import { ConfigProvider } from 'antd';

import moment from 'C:/Users/DJCHAN/SE/1 - CourseProject/ParalHub/admin/node_modules/dayjs';
import 'C:/Users/DJCHAN/SE/1 - CourseProject/ParalHub/admin/node_modules/dayjs/locale/zh-cn';
import { RawIntlProvider, getLocale, getDirection , setIntl, getIntl, localeInfo, event, LANG_CHANGE_EVENT } from './localeExports';




export function _onCreate() {
  const locale = getLocale();
  if (moment?.locale) {
    moment.locale(localeInfo[locale]?.momentLocale || '');
  }
  setIntl(locale);
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? React.useLayoutEffect
    : React.useEffect

export const _LocaleContainer = (props:any) => {
    const initLocale = getLocale();
    const [locale, setLocale] = React.useState(initLocale);
  const [intl, setContainerIntl] = React.useState(() => getIntl(locale, true));

  const handleLangChange = (locale:string) => {
    if (moment?.locale) {
      moment.locale(localeInfo[locale]?.momentLocale || 'en');
    }
    setLocale(locale);
    setContainerIntl(getIntl(locale));
  };

  useIsomorphicLayoutEffect(() => {
    event.on(LANG_CHANGE_EVENT, handleLangChange);
    return () => {
      event.off(LANG_CHANGE_EVENT, handleLangChange);
    };
  }, []);

  const defaultAntdLocale = {
  }
  const direction = getDirection();

  return (
    <ConfigProvider  direction={direction} locale={localeInfo[locale]?.antd || defaultAntdLocale}>
      <RawIntlProvider value={intl}>{props.children}</RawIntlProvider>
    </ConfigProvider>
  )
};
