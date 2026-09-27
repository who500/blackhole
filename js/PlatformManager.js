/**
 * Singularity Collector — Multi-Platform Integration Service
 * Seamlessly supports:
 * 1. VK Games & OK (VK Mini Apps / Direct Games via VK Bridge)
 * 2. Yandex Games SDK (v2)
 * 3. Localhost / Standalone Mock Layer
 */

window.PlatformManager = (function() {
  'use strict';

  // Platform Types: 'vk', 'yandex', 'mock'
  let platformType = 'mock';
  let isInitialized = false;

  // VK State
  let vkUser = null;

  // Yandex State
  let ysdk = null;
  let player = null;

  // Timers & Ads
  const AD_INTERVAL_SECONDS = 180;
  let adTimer = 0;
  let isAdShowing = false;
  let isSessionActive = false;

  const BOOST_DURATION_SECONDS = 60;
  let boostTimer = 0;
  let isRewardedAdShowing = false;

  let isPausedByAd = false;
  let isPausedByVisibility = false;

  const SCORE_SUBMIT_INTERVAL_MS = 12000;
  let lastScoreSubmissionTime = 0;
  let pendingScore = null;

  // Mock Leaderboard Dataset
  const mockLeaderboards = {
    leaderboard_week: [
      { rank: 1, name: 'VoidSurfer', score: 4820, avatar: null },
      { rank: 2, name: 'QuantumFlux', score: 3950, avatar: null },
      { rank: 3, name: 'StarDust_X', score: 3120, avatar: null },
      { rank: 4, name: 'AstroCollector', score: 2450, avatar: null },
      { rank: 5, name: 'PulsarEcho', score: 1890, avatar: null },
      { rank: 6, name: 'NebulaPilot', score: 1240, avatar: null },
      { rank: 7, name: 'HorizonWalker', score: 860, avatar: null }
    ],
    leaderboard_month: [
      { rank: 1, name: 'SingularityKing', score: 18400, avatar: null },
      { rank: 2, name: 'VoidSurfer', score: 14210, avatar: null },
      { rank: 3, name: 'DarkMatter99', score: 11850, avatar: null },
      { rank: 4, name: 'ChronoDrift', score: 9340, avatar: null },
      { rank: 5, name: 'QuantumFlux', score: 7820, avatar: null },
      { rank: 6, name: 'EventHorizon', score: 5400, avatar: null },
      { rank: 7, name: 'AstroSeeker', score: 3910, avatar: null }
    ],
    leaderboard_all_time: [
      { rank: 1, name: 'InfiniteGravity', score: 89450, avatar: null },
      { rank: 2, name: 'CosmicMonolith', score: 64200, avatar: null },
      { rank: 3, name: 'SingularityKing', score: 51900, avatar: null },
      { rank: 4, name: 'MatterDevourer', score: 42100, avatar: null },
      { rank: 5, name: 'BlackHoleGod', score: 36750, avatar: null },
      { rank: 6, name: 'VoidSurfer', score: 28600, avatar: null },
      { rank: 7, name: 'SuperNova_Pro', score: 19800, avatar: null }
    ]
  };

  // Immediate early VKWebAppInit handshake as recommended by VK Games guidelines
  if (typeof window.vkBridge !== 'undefined' && typeof window.vkBridge.send === 'function') {
    window.vkBridge.send('VKWebAppInit').catch(() => {});
  }

  /**
   * 1. Detect Platform: VK, Yandex, or Mock
   */
  function detectPlatform() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasVkParams = Boolean(
      urlParams.get('vk_user_id') || 
      urlParams.get('vk_platform') || 
      urlParams.get('vk_app_id') ||
      urlParams.get('api_id') ||
      urlParams.get('platform') === 'vk' ||
      (window.name && window.name.includes('vk_'))
    );

    // If VK Bridge is loaded and VK context or iframe or standalone VK param is present
    if (typeof window.vkBridge !== 'undefined') {
      if (hasVkParams || (window.self !== window.top) || typeof window.YaGames === 'undefined') {
        return 'vk';
      }
    }

    if (typeof window.YaGames !== 'undefined' && !hasVkParams) {
      return 'yandex';
    }

    return 'mock';
  }

  /**
   * 2. Initialize Platform
   */
  async function init() {
    if (isInitialized) return;

    platformType = detectPlatform();
    console.log(`[PlatformManager] Active platform: "${platformType}"`);

    setupFocusAndVisibilityHandlers();

    if (platformType === 'vk') {
      await initVK();
    } else if (platformType === 'yandex') {
      await initYandex();
    } else {
      initMock();
    }

    isInitialized = true;
  }

  /**
   * 2.1 VK Games / OK Initialization
   */
  async function initVK() {
    try {
      // 1. Mandatory VKWebAppInit handshake
      await window.vkBridge.send('VKWebAppInit');
      console.log('[PlatformManager] VK Bridge initialized: VKWebAppInit acknowledged.');

      // 2. Language detection from VK launch parameters
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const vkLang = urlParams.get('vk_language') || urlParams.get('lang') || 'ru';
        console.log('[PlatformManager] VK Language detected:', vkLang);
        if (window.i18n && typeof window.i18n.applySdkLanguage === 'function') {
          window.i18n.applySdkLanguage(vkLang);
        }
      } catch (langErr) {
        console.warn('[PlatformManager] VK Language read error:', langErr);
      }

      // 3. Get User Profile info (name, photo)
      try {
        const userInfo = await window.vkBridge.send('VKWebAppGetUserInfo');
        if (userInfo && userInfo.id) {
          vkUser = {
            id: userInfo.id,
            name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'Игрок VK',
            avatar: userInfo.photo_100 || userInfo.photo_200 || null
          };
          console.log('[PlatformManager] VK User authorized:', vkUser.name);
        }
      } catch (userErr) {
        console.log('[PlatformManager] VK User info not permitted or guest mode:', userErr);
      }

      // 4. Load Cloud Saves from VK Storage
      await loadCloudData();
    } catch (err) {
      console.warn('[PlatformManager] VK Bridge init failed, falling back to mock:', err);
      initMock();
    }
  }

  /**
   * 2.2 Yandex Games Initialization
   */
  async function initYandex() {
    try {
      ysdk = await window.YaGames.init();
      console.log('[PlatformManager] Yandex Games SDK initialized.');

      // Requirement 2.14: Automatic language detection
      try {
        if (ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang) {
          const sdkLang = ysdk.environment.i18n.lang;
          if (window.i18n && typeof window.i18n.applySdkLanguage === 'function') {
            window.i18n.applySdkLanguage(sdkLang);
          }
        }
      } catch (langErr) {
        console.warn('[PlatformManager] Yandex language detect note:', langErr);
      }

      // Game Ready API
      try {
        if (ysdk.features && ysdk.features.LoadingAPI) {
          ysdk.features.LoadingAPI.ready();
        }
      } catch (e) {}

      // Authorized player for Cloud Saves
      try {
        player = await ysdk.getPlayer({ scopes: false });
        await loadCloudData();
      } catch (pErr) {
        console.log('[PlatformManager] Yandex guest player mode');
      }
    } catch (err) {
      console.warn('[PlatformManager] Yandex init failed, falling back to mock:', err);
      initMock();
    }
  }

  /**
   * 2.3 Localhost / Mock Initialization
   */
  function initMock() {
    platformType = 'mock';
    let mockLang = 'ru';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      mockLang = urlParams.get('lang') || urlParams.get('language') || (navigator.language || 'ru').substring(0, 2).toLowerCase();
    } catch (e) {}

    if (window.i18n && typeof window.i18n.applySdkLanguage === 'function') {
      window.i18n.applySdkLanguage(mockLang);
    }

    loadLocalMockCloudData();
  }

  /**
   * 3. Focus & Audio Management
   */
  function setupFocusAndVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        onTabHidden();
      } else {
        onTabVisible();
      }
    });

    window.addEventListener('blur', onTabHidden);
    window.addEventListener('focus', () => {
      if (!document.hidden) onTabVisible();
    });

    // VK Bridge native lifecycle events for mobile VK app (Android & iOS)
    if (typeof window.vkBridge !== 'undefined' && typeof window.vkBridge.subscribe === 'function') {
      window.vkBridge.subscribe((e) => {
        if (!e || !e.detail) return;
        const { type } = e.detail;
        if (type === 'VKWebAppViewHide') {
          console.log('[PlatformManager] VKWebAppViewHide received -> pausing');
          onTabHidden();
        } else if (type === 'VKWebAppViewRestore') {
          console.log('[PlatformManager] VKWebAppViewRestore received -> resuming');
          onTabVisible();
        }
      });
    }
  }

  function gameplayStart() {
    if (platformType === 'yandex' && ysdk && ysdk.features && ysdk.features.GameplayAPI) {
      try { ysdk.features.GameplayAPI.start(); } catch (e) {}
    }
  }

  function gameplayStop() {
    if (platformType === 'yandex' && ysdk && ysdk.features && ysdk.features.GameplayAPI) {
      try { ysdk.features.GameplayAPI.stop(); } catch (e) {}
    }
  }

  function onTabHidden() {
    isPausedByVisibility = true;
    gameplayStop();
    pauseGameAudioAndPhysics();
  }

  function onTabVisible() {
    isPausedByVisibility = false;
    if (!isPausedByAd) {
      resumeGameAudioAndPhysics();
      if (isSessionActive) {
        gameplayStart();
      }
    }
  }

  function pauseGameAudioAndPhysics() {
    if (window.PhysicsEngine && typeof window.PhysicsEngine.setPaused === 'function') {
      window.PhysicsEngine.setPaused(true);
    }
    if (window.SoundEngine && typeof window.SoundEngine.suspend === 'function') {
      window.SoundEngine.suspend();
    }
  }

  function resumeGameAudioAndPhysics() {
    if (window.PhysicsEngine && typeof window.PhysicsEngine.setPaused === 'function') {
      window.PhysicsEngine.setPaused(false);
    }
    if (window.SoundEngine && typeof window.SoundEngine.resume === 'function') {
      if (window.Progression && window.Progression.getState && window.Progression.getState().soundEnabled) {
        window.SoundEngine.resume();
      }
    }
  }

  /**
   * 4. Interstitial Ads & Boost Timers
   */
  function updateTimer(dt) {
    if (!isSessionActive || isPausedByAd || isPausedByVisibility) return;

    // 1. Tick interstitial timer (every 180s)
    adTimer += dt;
    if (adTimer >= AD_INTERVAL_SECONDS) {
      showFullscreenAdv();
    }

    // 2. Tick Rewarded Boost timer
    if (boostTimer > 0) {
      boostTimer -= dt;
      if (boostTimer <= 0) {
        boostTimer = 0;
        if (window.GameUI && typeof window.GameUI.showToast === 'function') {
          const msg = window.i18n ? window.i18n.t('boost_toast_end') : '⚡ Буст x2 завершён';
          window.GameUI.showToast(msg);
        }
      }
    }
  }

  function startSession() {
    isSessionActive = true;
    adTimer = 0;
    gameplayStart();
  }

  /**
   * 5. Fullscreen Interstitial Ads (VK + Yandex + Mock)
   */
  async function showFullscreenAdv() {
    if (isAdShowing) return;
    isAdShowing = true;
    adTimer = 0;

    if (platformType === 'vk' && window.vkBridge) {
      try {
        const check = await window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'interstitial' });
        if (check && check.result) {
          isPausedByAd = true;
          pauseGameAudioAndPhysics();

          await window.vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
        }
      } catch (adErr) {
        console.warn('[PlatformManager] VK Interstitial error or rejected:', adErr);
      } finally {
        isAdShowing = false;
        isPausedByAd = false;
        if (!isPausedByVisibility) resumeGameAudioAndPhysics();
      }
    } else if (platformType === 'yandex' && ysdk && ysdk.adv) {
      ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            isPausedByAd = true;
            gameplayStop();
            pauseGameAudioAndPhysics();
          },
          onClose: () => {
            isAdShowing = false;
            isPausedByAd = false;
            if (!isPausedByVisibility) {
              resumeGameAudioAndPhysics();
              if (isSessionActive) gameplayStart();
            }
          },
          onError: () => {
            isAdShowing = false;
            isPausedByAd = false;
            if (!isPausedByVisibility) {
              resumeGameAudioAndPhysics();
              if (isSessionActive) gameplayStart();
            }
          }
        }
      });
    } else {
      // Mock ad
      isPausedByAd = true;
      pauseGameAudioAndPhysics();
      setTimeout(() => {
        isAdShowing = false;
        isPausedByAd = false;
        if (!isPausedByVisibility) resumeGameAudioAndPhysics();
      }, 1000);
    }
  }

  /**
   * 6. Rewarded Video Ads (VK + Yandex + Mock)
   */
  async function showRewardedVideo(onSuccess, onError) {
    if (isAdShowing || isRewardedAdShowing) {
      if (window.GameUI && typeof window.GameUI.showToast === 'function') {
        const msg = window.i18n ? window.i18n.t('ad_loading') : 'Реклама уже загружается...';
        window.GameUI.showToast(msg);
      }
      return;
    }

    isRewardedAdShowing = true;
    let rewardGiven = false;

    if (platformType === 'vk' && window.vkBridge) {
      try {
        const check = await window.vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' });
        if (check && check.result) {
          isPausedByAd = true;
          pauseGameAudioAndPhysics();

          const result = await window.vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
          if (result && result.result) {
            rewardGiven = true;
            activateBoost(BOOST_DURATION_SECONDS);
            if (typeof onSuccess === 'function') onSuccess();
          }
        } else {
          if (window.GameUI && typeof window.GameUI.showToast === 'function') {
            window.GameUI.showToast(window.i18n ? window.i18n.t('ad_error') : 'Реклама недоступна');
          }
        }
      } catch (vkAdErr) {
        console.warn('[PlatformManager] VK Rewarded Video error:', vkAdErr);
        if (typeof onError === 'function') onError(vkAdErr);
      } finally {
        isRewardedAdShowing = false;
        isPausedByAd = false;
        if (!isPausedByVisibility) resumeGameAudioAndPhysics();
      }
    } else if (platformType === 'yandex' && ysdk && ysdk.adv) {
      ysdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            isPausedByAd = true;
            gameplayStop();
            pauseGameAudioAndPhysics();
          },
          onRewarded: () => {
            rewardGiven = true;
            activateBoost(BOOST_DURATION_SECONDS);
          },
          onClose: () => {
            isRewardedAdShowing = false;
            isPausedByAd = false;
            if (!isPausedByVisibility) {
              resumeGameAudioAndPhysics();
              if (isSessionActive) gameplayStart();
            }
            if (rewardGiven && typeof onSuccess === 'function') onSuccess();
          },
          onError: (err) => {
            isRewardedAdShowing = false;
            isPausedByAd = false;
            if (!isPausedByVisibility) {
              resumeGameAudioAndPhysics();
              if (isSessionActive) gameplayStart();
            }
            if (typeof onError === 'function') onError(err);
          }
        }
      });
    } else {
      // Mock Rewarded
      isPausedByAd = true;
      pauseGameAudioAndPhysics();
      setTimeout(() => {
        rewardGiven = true;
        activateBoost(BOOST_DURATION_SECONDS);
        isRewardedAdShowing = false;
        isPausedByAd = false;
        if (!isPausedByVisibility) resumeGameAudioAndPhysics();
        if (typeof onSuccess === 'function') onSuccess();
      }, 1000);
    }
  }

  function activateBoost(seconds = 60) {
    boostTimer += seconds;
    if (window.GameUI && typeof window.GameUI.showToast === 'function') {
      const msg = window.i18n 
        ? window.i18n.t('boost_toast_active', {val: seconds}) 
        : `⚡ Буст x2 активен! (+${seconds} сек)`;
      window.GameUI.showToast(msg);
    }
  }

  /**
   * 7. Cloud Storage (VK Storage / Yandex Player Data / LocalStorage)
   */
  async function saveCloudData(gameState) {
    if (!gameState) return;

    const payload = {
      mass: gameState.mass,
      totalAbsorbed: gameState.totalMatter || gameState.totalAbsorbed || 0,
      totalMatter: gameState.totalMatter || gameState.totalAbsorbed || 0,
      upgrades: gameState.upgrades,
      soundEnabled: gameState.soundEnabled,
      hapticsEnabled: gameState.hapticsEnabled,
      savedAt: Date.now()
    };

    if (platformType === 'vk' && window.vkBridge) {
      try {
        await window.vkBridge.send('VKWebAppStorageSet', {
          key: 'singularity_save',
          value: JSON.stringify(payload)
        });
        console.log('[PlatformManager] VK Cloud save successful.');
      } catch (err) {
        console.warn('[PlatformManager] VK StorageSet note:', err);
      }
    } else if (platformType === 'yandex' && player) {
      try {
        await player.setData(payload, true);
        console.log('[PlatformManager] Yandex Cloud save successful.');
      } catch (err) {
        console.warn('[PlatformManager] Yandex setData note:', err);
      }
    } else {
      try {
        localStorage.setItem('singularity_cloud_mock', JSON.stringify(payload));
      } catch (e) {}
    }
  }

  async function loadCloudData() {
    if (platformType === 'vk' && window.vkBridge) {
      try {
        const res = await window.vkBridge.send('VKWebAppStorageGet', { keys: ['singularity_save'] });
        if (res && res.keys && res.keys.length > 0) {
          const val = res.keys[0].value;
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed.mass === 'number') {
              console.log('[PlatformManager] Cloud save loaded from VK Storage:', parsed);
              if (window.Progression && typeof window.Progression.applyCloudData === 'function') {
                window.Progression.applyCloudData(parsed);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[PlatformManager] VK StorageGet error:', err);
      }
    } else if (platformType === 'yandex' && player) {
      try {
        const cloudData = await player.getData();
        if (cloudData && typeof cloudData.mass === 'number') {
          console.log('[PlatformManager] Cloud save loaded from Yandex:', cloudData);
          if (window.Progression && typeof window.Progression.applyCloudData === 'function') {
            window.Progression.applyCloudData(cloudData);
          }
        }
      } catch (err) {
        console.warn('[PlatformManager] Yandex getData note:', err);
      }
    } else {
      loadLocalMockCloudData();
    }
  }

  function loadLocalMockCloudData() {
    try {
      const raw = localStorage.getItem('singularity_cloud_mock') || localStorage.getItem('singularity_yandex_cloud_mock');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (window.Progression && typeof window.Progression.applyCloudData === 'function') {
          window.Progression.applyCloudData(parsed);
        }
      }
    } catch (e) {}
  }

  /**
   * 8. Leaderboard Score Submissions
   */
  function submitScore(score, force = false) {
    pendingScore = score;
    const now = Date.now();

    if (!force && (now - lastScoreSubmissionTime < SCORE_SUBMIT_INTERVAL_MS)) {
      return;
    }

    lastScoreSubmissionTime = now;
    const scoreToSend = pendingScore;

    if (platformType === 'vk' && window.vkBridge) {
      // In VK, we can update the leader board box and save highest score to storage
      try {
        window.vkBridge.send('VKWebAppStorageSet', {
          key: 'singularity_best_score',
          value: String(scoreToSend)
        }).catch(() => {});
        console.log(`[PlatformManager] Submitted score ${scoreToSend} to VK.`);
      } catch (e) {}
    } else if (platformType === 'yandex' && ysdk) {
      const setOnBoard = (boardId) => {
        if (ysdk.leaderboards && typeof ysdk.leaderboards.setScore === 'function') {
          ysdk.leaderboards.setScore(boardId, scoreToSend).catch(() => {});
        } else if (ysdk.getLeaderboards) {
          ysdk.getLeaderboards().then(lb => {
            lb.setLeaderboardScore(boardId, scoreToSend).catch(() => {});
          }).catch(() => {});
        }
      };
      setOnBoard('leaderboard');
      setOnBoard('leaderboard_week');
      setOnBoard('leaderboard_month');
      setOnBoard('leaderboard_all_time');
      console.log(`[PlatformManager] Submitted score ${scoreToSend} to Yandex Leaderboards.`);
    } else {
      console.log(`[PlatformManager Mock] Submitted score ${scoreToSend} to local leaderboards.`);
    }
  }

  /**
   * 9. Leaderboard Retrieval & Display
   */
  async function getLeaderboardData(tabKey = 'leaderboard_week') {
    const userScore = (window.Progression && typeof window.Progression.getTotalMatter === 'function') 
      ? window.Progression.getTotalMatter() 
      : 0;

    submitScore(userScore, true);

    const playerName = (vkUser && vkUser.name) 
      || (player && typeof player.getName === 'function' && player.getName()) 
      || (player && player.publicName) 
      || (window.i18n ? window.i18n.t('you') : 'Вы');
    
    const playerAvatar = (vkUser && vkUser.avatar) 
      || (player && typeof player.getAvatarSrc === 'function' && player.getAvatarSrc('small')) 
      || null;

    if (platformType === 'yandex' && ysdk) {
      try {
        let lbEntriesRes = null;
        if (ysdk.leaderboards && typeof ysdk.leaderboards.getEntries === 'function') {
          try {
            lbEntriesRes = await ysdk.leaderboards.getEntries(tabKey, { quantityTop: 10, includeUser: true, quantityAround: 1 });
          } catch (e1) {
            try {
              lbEntriesRes = await ysdk.leaderboards.getEntries('leaderboard', { quantityTop: 10, includeUser: true, quantityAround: 1 });
            } catch (e2) {}
          }
        } else if (typeof ysdk.getLeaderboards === 'function') {
          const lb = await ysdk.getLeaderboards();
          try {
            lbEntriesRes = await lb.getLeaderboardEntries(tabKey, { quantityTop: 10, includeUser: true, quantityAround: 1 });
          } catch (e3) {
            try {
              lbEntriesRes = await lb.getLeaderboardEntries('leaderboard', { quantityTop: 10, includeUser: true, quantityAround: 1 });
            } catch (e4) {}
          }
        }

        if (lbEntriesRes && lbEntriesRes.entries && lbEntriesRes.entries.length > 0) {
          const myId = (player && typeof player.getUniqueID === 'function') ? player.getUniqueID() : null;
          const entries = lbEntriesRes.entries.map(entry => {
            const entryId = (entry.player && entry.player.uniqueID) || null;
            const isUser = (myId && entryId && entryId === myId) || (entry.rank === lbEntriesRes.userRank);

            return {
              rank: entry.rank,
              name: (entry.player && entry.player.publicName) || (isUser ? playerName : (window.i18n ? window.i18n.t('stranger') : 'Странник')),
              score: entry.score,
              avatar: (entry.player && entry.player.getAvatarSrc && entry.player.getAvatarSrc('small')) || (isUser ? playerAvatar : null),
              isUser: isUser
            };
          });

          return {
            userRank: lbEntriesRes.userRank || 1,
            userScore: userScore,
            entries: entries
          };
        }
      } catch (err) {
        console.warn('[PlatformManager] Leaderboard read fallback:', err);
      }
    }

    // Dynamic Leaderboard with User correctly positioned
    const baseList = (mockLeaderboards[tabKey] || mockLeaderboards.leaderboard_week).map(item => ({ ...item }));

    const userEntry = {
      name: playerName,
      score: userScore,
      avatar: playerAvatar,
      isUser: true
    };

    const combined = [...baseList, userEntry].sort((a, b) => b.score - a.score);

    let userRank = 1;
    combined.forEach((item, idx) => {
      item.rank = idx + 1;
      if (item.isUser) userRank = item.rank;
    });

    return {
      userRank,
      userScore,
      entries: combined.slice(0, 10)
    };
  }

  /**
   * 10. Social Mechanics: Share / Invite / Add to Favorites (VK Bridge)
   */
  async function shareGame() {
    if (platformType === 'vk' && window.vkBridge) {
      try {
        await window.vkBridge.send('VKWebAppShare', {
          link: window.location.href
        });
      } catch (e) {}
    }
  }

  async function addToFavorites() {
    if (platformType === 'vk' && window.vkBridge) {
      try {
        await window.vkBridge.send('VKWebAppAddToFavorites');
      } catch (e) {}
    }
  }

  const publicApi = {
    init,
    startSession,
    gameplayStart,
    gameplayStop,
    update: updateTimer,
    showFullscreenAdv,
    showRewardedVideo,
    activateBoost,
    isBoostActive: () => boostTimer > 0,
    getBoostTimeRemaining: () => Math.max(0, boostTimer),
    saveCloudData,
    loadCloudData,
    submitScore,
    getLeaderboardData,
    shareGame,
    addToFavorites,
    getPlatform: () => platformType,
    isMock: () => platformType === 'mock',
    isAdActive: () => (isAdShowing || isRewardedAdShowing),
    isPaused: () => (isPausedByAd || isPausedByVisibility),
    getLang: () => {
      if (platformType === 'yandex' && ysdk && ysdk.environment && ysdk.environment.i18n) {
        return ysdk.environment.i18n.lang;
      }
      return window.i18n ? window.i18n.getLang() : 'ru';
    },
    getVkUser: () => vkUser,
    LEADERBOARDS: {
      week: 'leaderboard',
      month: 'leaderboard',
      allTime: 'leaderboard'
    }
  };

  // Backwards compatibility alias for YandexManager
  window.YandexManager = publicApi;

  return publicApi;
})();
