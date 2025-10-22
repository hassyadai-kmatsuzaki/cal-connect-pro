/**
 * 現在のドメインがセントラルドメインかテナントドメインかを判定
 */
export const isCentralDomain = (): boolean => {
  const hostname = window.location.hostname;
  // localhostまたは127.0.0.1はセントラルドメイン
  const isCentral = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // デバッグ用ログ
  console.log('[API Utils] Hostname:', hostname);
  console.log('[API Utils] Is Central Domain:', isCentral);
  
  return isCentral;
};

/**
 * APIのベースパスを取得
 */
export const getApiBasePath = (): string => {
  const basePath = isCentralDomain() ? '/api/central' : '/api';
  
  // デバッグ用ログ
  console.log('[API Utils] API Base Path:', basePath);
  
  return basePath;
};

/**
 * 現在がテナントコンテキストかどうかを判定
 */
export const isTenantContext = (): boolean => {
  return !isCentralDomain();
};

