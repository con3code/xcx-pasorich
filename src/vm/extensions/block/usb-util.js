/**
 * WebUSB 共通ユーティリティ
 */

/**
 * 指定時間待つ。
 * @param {number} msec - 待ち時間 (ms)
 * @returns {Promise} 待ち完了で resolve する Promise
 */
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

/**
 * バイト列をそのまま送信する。
 * @param {USBDevice} device - 送信先デバイス
 * @param {number} endpointOut - OUT エンドポイント番号
 * @param {Array<number>} data - 送信データ
 */
const send = async (device, endpointOut, data) => {
    await device.transferOut(endpointOut, new Uint8Array(data));
    await sleep(10);
};

/**
 * データを受信してバイト値の配列で返す。
 * @param {USBDevice} device - 受信元デバイス
 * @param {number} endpointIn - IN エンドポイント番号
 * @param {number} len - 最大受信長
 * @returns {Promise<Array<number>>} 受信したバイト値の配列
 */
const receive = async (device, endpointIn, len) => {
    const result = await device.transferIn(endpointIn, len);
    await sleep(10);
    const arr = [];
    for (let i = 0; i < result.data.byteLength; i++) {
        arr.push(result.data.getUint8(i));
    }
    return arr;
};

/**
 * バイト値の配列を 16 進文字列に変換する。
 * @param {Array<number>} bytes - バイト値の配列
 * @returns {string} 16 進文字列 (小文字・ゼロ詰め)
 */
const bytesToHex = bytes => bytes
    .map(b => b.toString(16)
        .padStart(2, '0'))
    .join('');

/**
 * PaSoRi (RC-S310/S320/S330/S380) 共通の物理フレーム用 ACK。
 * PN53x 系では実行中コマンドの中断にも使う。
 */
const PASORI_ACK = [0x00, 0x00, 0xff, 0x00, 0xff, 0x00];

/**
 * フレームのチェックサム (総和の 2 の補数) を計算する。
 * @param {Array<number>} bytes - 対象バイト列
 * @returns {number} チェックサム値
 */
const frameChecksum = bytes => {
    let sum = 0;
    for (const b of bytes) {
        sum += b;
    }
    return (0x100 - (sum & 0xff)) & 0xff;
};

/**
 * PaSoRi 共通フレーム (00 00 FF LEN LCS payload DCS 00) を組み立てる。
 * @param {Array<number>} payload - コマンド本体 (1〜248 バイト)
 * @returns {Array<number>} フレーム全体
 */
const buildPasoriFrame = payload => [
    0x00, 0x00, 0xff,
    payload.length,
    (0x100 - payload.length) & 0xff,
    ...payload,
    frameChecksum(payload),
    0x00
];

/**
 * PaSoRi 共通フレームを検証してペイロードを取り出す。
 * @param {Array<number>} bytes - 受信フレーム
 * @returns {Array<number>|null} ペイロード (フレーム不正なら null)
 */
const parsePasoriFrame = bytes => {
    if (bytes.length < 7 || bytes[0] !== 0x00 || bytes[1] !== 0x00 || bytes[2] !== 0xff) {
        return null;
    }
    const len = bytes[3];
    if (bytes[4] !== ((0x100 - len) & 0xff) || bytes.length < len + 7) {
        return null;
    }
    const payload = bytes.slice(5, 5 + len);
    if (bytes[5 + len] !== frameChecksum(payload)) {
        return null;
    }
    return payload;
};

/**
 * Promise にタイムアウトをかける。
 * WebUSB の transferIn にはタイムアウトがないため、カード不在などで
 * 応答が返らないときにブロックが固まるのを防ぐ。
 * @param {Promise} promise - 対象の Promise
 * @param {number} msec - タイムアウト (ms)
 * @returns {Promise} タイムアウト付き Promise
 */
const withTimeout = (promise, msec) => {
    let timer;
    const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`USB response timeout (${msec}ms)`)), msec);
    });
    return Promise.race([promise, timeout])
        .finally(() => clearTimeout(timer));
};

export {sleep, send, receive, bytesToHex, PASORI_ACK, buildPasoriFrame, parsePasoriFrame, withTimeout};
