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

export {sleep, send, receive, bytesToHex};
