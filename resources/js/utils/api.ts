/**
 * 現在のドメインがセントラルドメインかテナントドメインかを判定
 */
export const isCentralDomain = (): boolean => {
  const hostname = window.location.hostname;
  // localhost、127.0.0.1、anken.cloudはセントラルドメイン
  const isCentral = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'anken.cloud';
  
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

/**
 * テナントIDを取得（テナントドメインの場合）
 */
export const getTenantId = (): string | null => {
  if (isCentralDomain()) {
    return null;
  }
  
  // テナントドメインの場合、サブドメインからテナントIDを推測
  // または、APIレスポンスから取得する方法もある
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // 実際のテナントIDは、APIから取得する必要がある
  // ここでは一時的にサブドメインを使用
  return subdomain !== 'www' ? subdomain : null;
};

