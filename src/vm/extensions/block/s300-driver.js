/**
 * SONY RC-S300 用ドライバ
 * ベンダー固有クラス (255) のインターフェイス経由で CCID エスケープコマンド
 * (PC/SC 透過セッション) を送り、FeliCa ポーリングで IDm を読み取る。
 *
 * 参考: RC-S300 は ISO/IEC 14443 Type A/B にもハードウェア対応しており、
 * プロトコル切替 (データオブジェクト 8F 02 xx xx) を変更すれば Type A/B の
 * ポーリングにも拡張できる (docs/usb-nfc4-typeb-report.md 参照)。
 */

import {receive, sleep, bytesToHex} from './usb-util';

const productIds = [0x0dc8, 0x0dc9]; // RC-S300/S, RC-S300/P

let seqNumber = 0;

/**
 * CCID (PC_to_RDR_Escape) ヘッダーを付けてコマンドを送信する。
 * @param {USBDevice} device - 対象デバイス
 * @param {number} endpointOut - OUT エンドポイント番号
 * @param {Array<number>} data - エスケープコマンド本体
 */
const sendEscape = async (device, endpointOut, data) => {
    const uint8data = new Uint8Array(data);
    const dataLength = uint8data.length;
    const SLOTNUMBER = 0x00;
    const reqPckt = new Uint8Array(10 + dataLength);

    seqNumber = (seqNumber + 1) & 0xff;
    reqPckt[0] = 0x6b; // PC_to_RDR_Escape
    reqPckt[1] = 255 & dataLength;
    reqPckt[2] = (dataLength >> 8) & 255;
    reqPckt[3] = (dataLength >> 16) & 255;
    reqPckt[4] = (dataLength >> 24) & 255;
    reqPckt[5] = SLOTNUMBER;
    reqPckt[6] = seqNumber;

    if (dataLength !== 0) reqPckt.set(uint8data, 10);
    await device.transferOut(endpointOut, reqPckt);
    await sleep(20);
};

/**
 * デバイスを開いてベンダー固有インターフェイスを claim し、通信情報を返す。
 * @param {USBDevice} device - 対象デバイス
 * @returns {Promise<object>} interfaceNumber / endpointIn / endpointOut
 */
const setup = async device => {
    const configuration = device.configurations[0];
    const confValue = configuration.configurationValue || 1;
    // CCID クラス (0x0B) は WebUSB から claim できないため、ベンダー固有クラス (255) を使う
    const usbInterface = configuration.interfaces.find(v => v.alternate.interfaceClass === 255);
    const endpointIn = usbInterface.alternate.endpoints.find(e => e.direction === 'in').endpointNumber;
    const endpointOut = usbInterface.alternate.endpoints.find(e => e.direction === 'out').endpointNumber;

    await device.open();
    await device.selectConfiguration(confValue);
    await device.claimInterface(usbInterface.interfaceNumber);
    return {
        interfaceNumber: usbInterface.interfaceNumber,
        endpointIn: endpointIn,
        endpointOut: endpointOut
    };
};

/**
 * FeliCa ポーリングを行い IDm を読み取る。
 * @param {USBDevice} device - 対象デバイス
 * @param {object} claimed - setup() が返した通信情報
 * @returns {Promise<string>} IDm の 16 進文字列 (カードがなければ空文字列)
 */
const readIdm = async (device, claimed) => {
    const endpointOut = claimed.endpointOut;
    const endpointIn = claimed.endpointIn;
    const len = 50;

    // End Transparent Session
    await sendEscape(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
    await receive(device, endpointIn, len);

    // Start Transparent Session
    await sendEscape(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]);
    await receive(device, endpointIn, len);

    // RF Off
    await sendEscape(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
    await receive(device, endpointIn, len);

    // RF On
    await sendEscape(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]);
    await receive(device, endpointIn, len);

    // Switch Protocol: Type F (FeliCa)
    await sendEscape(device, endpointOut, [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]);
    await receive(device, endpointIn, len);

    // Transparent Exchange: FeliCa Polling
    await sendEscape(device, endpointOut, [
        0xFF, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5F, 0x46, 0x04, 0xA0, 0x86, 0x01, 0x00,
        0x95, 0x82, 0x00, 0x06, 0x06, 0x00, 0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00]);
    const pollingRes = await receive(device, endpointIn, len);

    if (pollingRes.length === 46) {
        return bytesToHex(pollingRes.slice(26, 34));
    }
    return '';
};

export default {productIds, setup, readIdm};
