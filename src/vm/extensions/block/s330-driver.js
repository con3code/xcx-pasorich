/**
 * SONY RC-S330 用ドライバ
 * NXP PN533 ベースのリーダー。bulk IN/OUT で PN53x コマンド (D4 xx) を送り、
 * InListPassiveTarget で FeliCa ポーリングを行い IDm を読み取る。
 * プロトコルは libpafe (https://github.com/rfujita/libpafe) の実装に準拠。
 *
 * 注意: レガシーデバイスのため Windows では WebUSB からアクセスできない
 * (WinUSB がバインドされない)。動作対象は macOS / Android の Chrome 系ブラウザ。
 */

import {send, receive, bytesToHex, PASORI_ACK, buildPasoriFrame, parsePasoriFrame, withTimeout} from './usb-util';

const productIds = [0x02e1]; // RC-S330

// productId ごとの機種名 (デバイスが productName を返さない場合の表示用)
const modelNames = {
    0x02e1: 'RC-S330'
};

// カード不在時などに応答待ちで固まらないようにするタイムアウト (ms)
// (リファレンス実装 libpafe のデフォルトは 400ms)
const RESPONSE_TIMEOUT = 500;

const RF_ANTENNA_ON = [0xd4, 0x32, 0x01, 0x01];
// InListPassiveTarget: MaxTg=1, BrTy=1 (FeliCa 212kbps),
// ポーリングコマンド (cmd=00, syscode=FFFF, RFU=00, timeslot=00)
const LIST_PASSIVE_TARGET_FELICA = [0xd4, 0x4a, 0x01, 0x01, 0x00, 0xff, 0xff, 0x00, 0x00];

/**
 * バルク転送エンドポイントを探す。
 * @param {USBInterface} usbInterface - 対象インターフェイス
 * @param {string} direction - 'in' または 'out'
 * @returns {USBEndpoint} 見つかったエンドポイント
 */
const getBulkEndpoint = (usbInterface, direction) =>
    usbInterface.alternate.endpoints.find(e => e.direction === direction && e.type === 'bulk');

/**
 * コマンドを送信し、ACK と応答フレームを受けてペイロードを返す。
 * @param {USBDevice} device - 対象デバイス
 * @param {object} claimed - setup() が返した通信情報
 * @param {Array<number>} payload - コマンド本体 (D4 xx ...)
 * @returns {Promise<Array<number>>} 応答ペイロード (D5 xx ...)
 */
const transceive = async (device, claimed, payload) => {
    await send(device, claimed.endpointOut, buildPasoriFrame(payload));
    const ack = await withTimeout(receive(device, claimed.endpointIn, 64), RESPONSE_TIMEOUT);
    if (ack.length !== 6 || ack[4] !== 0xff) {
        throw new Error('RC-S330: invalid ACK');
    }
    const resp = await withTimeout(receive(device, claimed.endpointIn, 255), RESPONSE_TIMEOUT);
    const respPayload = parsePasoriFrame(resp);
    if (!respPayload) {
        throw new Error('RC-S330: invalid response frame');
    }
    return respPayload;
};

/**
 * デバイスを開いてインターフェイスを claim し、RF をオンにして通信情報を返す。
 * @param {USBDevice} device - 対象デバイス
 * @returns {Promise<object>} interfaceNumber / endpointIn / endpointOut
 */
const setup = async device => {
    const configuration = device.configurations[0];
    const confValue = configuration.configurationValue || 1;
    const usbInterface = configuration.interfaces[0];
    const claimed = {
        interfaceNumber: usbInterface.interfaceNumber,
        endpointIn: getBulkEndpoint(usbInterface, 'in').endpointNumber,
        endpointOut: getBulkEndpoint(usbInterface, 'out').endpointNumber
    };

    await device.open();
    await device.selectConfiguration(confValue);
    await device.claimInterface(claimed.interfaceNumber);
    await transceive(device, claimed, RF_ANTENNA_ON);
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
        resp = await transceive(device, claimed, LIST_PASSIVE_TARGET_FELICA);
    } catch (error) {
        // カード不在などでタイムアウトしたら ACK フレームで実行中コマンドを
        // 中断し (PN53x 仕様)、他機種と同様に「IDm なし」として扱う
        await send(device, claimed.endpointOut, PASORI_ACK).catch(() => {});
        return '';
    }

    // 応答: D5 4B <NbTg> <Tg> <Len> 01 <IDm 8B> <PMm 8B> ...
    if (resp[0] !== 0xd5 || resp[1] !== 0x4b || (resp[2] || 0) < 1 || resp[5] !== 0x01) {
        return '';
    }
    return bytesToHex(resp.slice(6, 14));
};

export default {productIds, modelNames, setup, readIdm};
