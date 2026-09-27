/**
 * Singularity Collector - Internationalization (i18n)
 * Fully compliant with Yandex Games SDK Requirement 2.14 (Automatic Language Detection via SDK)
 */

window.i18n = (function() {
  'use strict';

  const translations = {
    ru: {
      absorbed: 'ПОГЛОЩЕНО',
      spheres: 'сфер',
      mass: 'МАССА',
      boost_tag: 'РЕКЛАМА',
      boost_label: '×2 БУСТ',
      resonance_title: 'ГРАВИТАЦИОННЫЙ РЕЗОНАНС',
      resonance_desc: '+{val}% к массе',
      
      upg_radius_name: 'Размер дыры',
      upg_radius_short: 'Размер',
      upg_gravity_name: 'Сила притяжения',
      upg_gravity_short: 'Магнит',
      upg_stream_name: 'Частота сфер',
      upg_stream_short: 'Поток',
      upg_density_name: 'Ценность сфер',
      upg_density_short: 'Доход',
      
      lvl: 'ур. {val}',
      per_sec: '/с',
      sec_short: 'с',
      
      settings_title: 'Настройки',
      settings_sound: 'Звуки',
      settings_haptics: 'Вибрация',
      settings_lang: 'Язык (Language)',
      settings_share: 'Поделиться игрой',
      settings_fav: 'Добавить в избранное',
      settings_reset: 'Сбросить прогресс',
      
      lb_title: 'Топ собирателей',
      lb_tab_all: 'За всё время',
      lb_tab_month: 'За месяц',
      lb_tab_week: 'За неделю',
      lb_your_result: 'ВАШ РЕЗУЛЬТАТ',
      lb_your_rank: 'МЕСТО В ТОПЕ',
      lb_empty: 'В этом периоде пока нет результатов.',
      lb_loading: 'Загрузка данных...',

      upgraded: 'Улучшено: {val}!',
      reset_success: 'Прогресс сингулярности сброшен',
      sound_on: 'Звук включен',
      sound_off: 'Звук выключен',
      vibro_on: 'Виброотклик включен',
      vibro_off: 'Виброотклик выключен',
      
      start_title: 'КОСНИТЕСЬ ЭКРАНА',
      start_subtitle: 'Управляйте сингулярностью и собирайте керамические сферы с приятным звуком поп-ита',
      
      reset_title: 'Сброс сингулярности',
      reset_desc: 'Сбросить весь накопленный прогресс и массу? Это действие необратимо.',
      btn_cancel: 'Отмена',
      btn_confirm: 'Да, сбросить',

      you: 'Вы',
      boost_toast_end: '⚡ Буст ×2 завершён',
      boost_toast_active: '⚡ Буст ×2 активен! (+{val} сек)',
      ad_loading: 'Реклама уже загружается...',
      ad_error: 'Ошибка загрузки рекламы',
      ad_watching: 'Просмотр рекламы...',
      stranger: 'Странник',

      tooltip_lb: 'Таблица лидеров',
      tooltip_settings: 'Настройки',
      tooltip_boost: 'Удвоить частоту сфер и массу на 1 минуту за просмотр рекламы',
      aria_close: 'Закрыть',
      aria_sound: 'Звук',
      aria_haptics: 'Вибрация',
      aria_lb: 'Рейтинг'
    },
    en: {
      absorbed: 'ABSORBED',
      spheres: 'spheres',
      mass: 'MASS',
      boost_tag: 'AD',
      boost_label: '×2 BOOST',
      resonance_title: 'GRAVITATIONAL RESONANCE',
      resonance_desc: '+{val}% mass',
      
      upg_radius_name: 'Hole Size',
      upg_radius_short: 'Size',
      upg_gravity_name: 'Gravity Pull',
      upg_gravity_short: 'Magnet',
      upg_stream_name: 'Sphere Rate',
      upg_stream_short: 'Rate',
      upg_density_name: 'Sphere Value',
      upg_density_short: 'Income',
      
      lvl: 'lvl {val}',
      per_sec: '/s',
      sec_short: 's',
      
      settings_title: 'Settings',
      settings_sound: 'Sound',
      settings_haptics: 'Haptics',
      settings_lang: 'Language (Язык)',
      settings_share: 'Share Game',
      settings_fav: 'Add to Favorites',
      settings_reset: 'Reset Progress',
      
      lb_title: 'Top Collectors',
      lb_tab_all: 'All Time',
      lb_tab_month: 'Monthly',
      lb_tab_week: 'Weekly',
      lb_your_result: 'YOUR RESULT',
      lb_your_rank: 'YOUR RANK',
      lb_empty: 'No results for this period yet.',
      lb_loading: 'Loading data...',

      upgraded: 'Upgraded: {val}!',
      reset_success: 'Singularity progress reset',
      sound_on: 'Sound ON',
      sound_off: 'Sound OFF',
      vibro_on: 'Haptics ON',
      vibro_off: 'Haptics OFF',
      
      start_title: 'TOUCH THE SCREEN',
      start_subtitle: 'Control the singularity and collect ceramic spheres with satisfying pop-it sounds',
      
      reset_title: 'Reset Singularity',
      reset_desc: 'Reset all your progress and mass? This action is irreversible.',
      btn_cancel: 'Cancel',
      btn_confirm: 'Yes, reset',

      you: 'You',
      boost_toast_end: '⚡ Boost ×2 ended',
      boost_toast_active: '⚡ Boost ×2 active! (+{val}s)',
      ad_loading: 'Ad is loading...',
      ad_error: 'Failed to load ad',
      ad_watching: 'Watching ad...',
      stranger: 'Wanderer',

      tooltip_lb: 'Leaderboard',
      tooltip_settings: 'Settings',
      tooltip_boost: 'Double sphere rate and mass for 1 minute by watching an ad',
      aria_close: 'Close',
      aria_sound: 'Sound',
      aria_haptics: 'Haptics',
      aria_lb: 'Leaderboard'
    }
  };

  /**
   * Resolves language code to one of our supported translations ('ru' or 'en')
   * Per Yandex Games standards:
   * 'ru', 'be', 'kk', 'uk', 'uz' etc. map to Russian.
   * All other locales default to English.
   */
  function resolveLanguage(langCode) {
    if (!langCode || typeof langCode !== 'string') return 'ru';
    const clean = langCode.toLowerCase().trim().split(/[-_]/)[0];
    if (translations[clean]) return clean;
    if (['ru', 'be', 'kk', 'uk', 'uz', 'az', 'hy', 'ka', 'ky', 'tg', 'tk'].includes(clean)) {
      return 'ru';
    }
    return 'en';
  }

  /**
   * Determine initial language on script execution before SDK promise resolves:
   * 1. URL search param (?lang=en / ?lang=ru) sent by Yandex Games iframe/mocks
   * 2. Globally existing ysdk.environment.i18n.lang (if already loaded)
   * 3. Browser navigator language
   */
  function detectInitialLanguage() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang') || urlParams.get('language');
      if (urlLang) {
        return resolveLanguage(urlLang);
      }
    } catch (e) {}

    try {
      if (window.ysdk && window.ysdk.environment && window.ysdk.environment.i18n && window.ysdk.environment.i18n.lang) {
        return resolveLanguage(window.ysdk.environment.i18n.lang);
      }
    } catch (e) {}

    try {
      const navLang = (navigator.language || navigator.userLanguage || '').substring(0, 2).toLowerCase();
      if (navLang) {
        return resolveLanguage(navLang);
      }
    } catch (e) {}

    return 'ru';
  }

  let currentLang = detectInitialLanguage();

  // Set initial <html> lang attribute
  if (document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  /**
   * Apply language directly from Yandex Games SDK (Requirement 2.14)
   * This is called immediately once ysdk = await YaGames.init() resolves.
   */
  function applySdkLanguage(sdkLang) {
    if (!sdkLang) return;
    const resolved = resolveLanguage(sdkLang);
    console.log(`[i18n] Yandex Games SDK 2.14 language detected: "${sdkLang}" -> resolved: "${resolved}"`);
    setLang(resolved);
  }

  function setLang(lang) {
    const resolved = resolveLanguage(lang);
    currentLang = resolved;
    if (document.documentElement) {
      document.documentElement.lang = resolved;
    }
    updateDOM();
    if (typeof window.onLanguageChanged === 'function') {
      window.onLanguageChanged();
    }
  }
  
  function getLang() {
    return currentLang;
  }

  function t(key, params = {}) {
    const dict = translations[currentLang] || translations.ru;
    let str = dict[key] || (translations.en && translations.en[key]) || key;
    for (let k in params) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    }
    return str;
  }

  function updateDOM() {
    // 1. Text elements
    const els = document.querySelectorAll('[data-i18n]');
    els.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && translations[currentLang][key]) {
        el.textContent = translations[currentLang][key];
      }
    });

    // 2. Title attributes (tooltips)
    const titleEls = document.querySelectorAll('[data-i18n-title]');
    titleEls.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key && translations[currentLang][key]) {
        el.setAttribute('title', translations[currentLang][key]);
      }
    });

    // 3. ARIA labels (accessibility)
    const ariaEls = document.querySelectorAll('[data-i18n-aria]');
    ariaEls.forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (key && translations[currentLang][key]) {
        el.setAttribute('aria-label', translations[currentLang][key]);
      }
    });

    // 4. Synchronize settings language dropdown if it exists
    const select = document.getElementById('settings-lang-select');
    if (select && select.value !== currentLang) {
      select.value = currentLang;
    }
  }

  return { 
    init: updateDOM,
    applySdkLanguage,
    setLang, 
    getLang, 
    resolveLanguage,
    t, 
    updateDOM 
  };
})();

