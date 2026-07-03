/**
 * SONY RC-S310 / RC-S320 用ドライバ
 * 旧型 PaSoRi。送信は EP0 へのベンダーコントロール転送、受信は interrupt IN
 * という構成で、独自コマンド (0x62 系初期化 / 0x5C 書き込み / 0x5D 応答) を使う。
 * プロトコルは libpafe (https://github.com/rfujita/libpafe) の実装に準拠。
 * WebUSB での動作実績: https://github.com/muojp/webpasori
 *
 * 注意: レガシーデバイスのため Windows では WebUSB からアクセスできない
 * (WinUSB がバインドされない)。動作対象は macOS / Android の Chrome 系ブラウザ。
 */

import {sleep, receive, bytesToHex, buildPasoriFrame, parsePasoriFrame, withTimeout} from './usb-util';

const PRODUCT_ID_S310 = 0x006c;
const PRODUCT_ID_S320 = 0x01bb;
const productIds = [PRODUCT_ID_S310, PRODUCT_ID_S320];

// productId ごとの機種名 (デバイスが productName を返さない場合の表示用)
const modelNames = {
    [PRODUCT_ID_S310]: 'RC-S310',
    [PRODUCT_ID_S320]: 'RC-S320'
};

// カード不在時などに応答待ちで固まらないようにするタイムアウト (ms)
// (リファレンス実装 libpafe のデフォルトは 400ms)
const RESPONSE_TIMEOUT = 500;

// 初期化コマンド列 (libpafe の pasori_init と同じ。各コマンド後に応答を 1 回読む)
const S310_INIT_COMMANDS = [
    [0x54]
];
const S320_INIT_COMMANDS = [
    [0x62, 0x01, 0x82],
    [0x62, 0x02, 0x80, 0x81],
    [0x62, 0x22, 0x80, 0xcc, 0x81, 0x88],
    [0x62, 0x02, 0x80, 0x81],
    [0x62, 0x02, 0x82, 0x87],
    [0x62, 0x21, 0x25, 0x58],
    [0x5a, 0x80]
];

// FeliCa ポーリング: 0x5C <len+1> <cmd=00 syscode=FFFF RFU=00 timeslot=00>
const FELICA_POLLING = [0x5c, 0x06, 0x00, 0xff, 0xff, 0x00, 0x00];

/**
 * フレームを EP0 へのベンダーコントロール転送で送信する。
 * @param {USBDevice} device - 対象デバイス
 * @param {Array<number>} frame - 送信フレーム
 */
const controlSend = async (device, frame) => {
    await device.controlTransferOut({
        requestType: 'vendor',
        recipient: 'device',
        request: 0x00,
        value: 0x0000,
        index: 0x0000
    }, new Uint8Array(frame));
    await sleep(10);
};

/**
 * コマンドを送信し、ACK と応答フレームを受けてペイロードを返す。
 * @param {USBDevice} device - 対象デバイス
 * @param {object} claimed - setup() が返した通信情報
 * @param {Array<number>} payload - コマンド本体
 * @returns {Promise<Array<number>>} 応答ペイロード
 */
const transceive = async (device, claimed, payload) => {
    await controlSend(device, buildPasoriFrame(payload));
    const ack = await withTimeout(receive(device, claimed.endpointIn, 64), RESPONSE_TIMEOUT);
    if (ack.length !== 6 || ack[4] !== 0xff) {
        throw new Error('RC-S320: invalid ACK');
    }
    const resp = await withTimeout(receive(device, claimed.endpointIn, 255), RESPONSE_TIMEOUT);
    const respPayload = parsePasoriFrame(resp);
    if (!respPayload) {
        throw new Error('RC-S320: invalid response frame');
    }
    return respPayload;
};

/**
 * デバイスを開いてインターフェイスを claim し、初期化コマンドを実行して
 * 通信情報を返す。
 * @param {USBDevice} device - 対象デバイス
 * @returns {Promise<object>} interfaceNumber / endpointIn
 */
const setup = async device => {
    const configuration = device.configurations[0];
    const confValue = configuration.configurationValue || 1;
    const usbInterface = configuration.interfaces[0];
    const interruptIn = usbInterface.alternate.endpoints
        .find(e => e.direction === 'in' && e.type === 'interrupt');
    const claimed = {
        interfaceNumber: usbInterface.interfaceNumber,
        // libpafe のデフォルトは 0x81 (エンドポイント番号 1)
        endpointIn: interruptIn ? interruptIn.endpointNumber : 1
    };

    await device.open();
    await device.selectConfiguration(confValue);
    await device.claimInterface(claimed.interfaceNumber);

    const initCommands = device.productId === PRODUCT_ID_S310 ? S310_INIT_COMMANDS : S320_INIT_COMMANDS;
    for (const command of initCommands) {
        await transceive(device, claimed, command);
    }
    return claimed;
};

/**
 * FeliCa ポーリングを行い IDm を読み取る。
 * @param {USBDevice} device - 対象デバイス
 * @param {object} claimed - setup() が返した通信情報
 * @returns {Promise<string>} IDm の 16 進文字列 (カードがなければ空文字列)
 */
const readIdm = async (device, claimed) => {
    let resp;
    try {
        resp = await transceive(device, claimed, FELICA_POLLING);
    } catch (error) {
        // カード不在などでタイムアウトしたら他機種と同様に「IDm なし」として扱う
        return '';
    }

    // 応答: 5D <len> 01 <IDm 8B> <PMm 8B>
    if (resp[0] !== 0x5d || resp[2] !== 0x01) {
        return '';
    }
    return bytesToHex(resp.slice(3, 11));
};

export default {productIds, modelNames, setup, readIdm};
