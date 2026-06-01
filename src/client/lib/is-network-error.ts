// fetch() は到達不能・接続切断などネットワーク層の失敗時に TypeError を投げる。
// HTTP エラー応答 (4xx/5xx) は Response として返るためここには到達しない。
// この区別により「サーバー停止」と「通常の API エラー」を切り分ける。
export const isNetworkError = (error: unknown): boolean =>
  error instanceof TypeError;
