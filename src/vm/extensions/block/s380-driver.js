/**
 * SONY RC-S380 用ドライバ
 * ベンダー独自プロトコル (NFC Port-100) で FeliCa ポーリングを行い IDm を読み取る。
 */

import {send, receive, bytesToHex} from './usb-util';

const productIds = [0x06c1, 0x06c3]; // RC-S380/S, RC-S380/P

/**
 * バルク転送エンドポイントを探す。
 * @param {USBInterface} usbInterface - 対象インターフェイス
 * @param {string} direction - 'in' または 'out'
 * @returns {USBEndpoint} 見つかったエンドポイント
 */
const getBulkEndpoint = (usbInterface, direction) =>
    usbInterface.alternate.endpoints.find(e => e.direction === direction && e.type === 'bulk');

/**
 * デバイスを開いてインターフェイスを claim し、通信情報を返す。
 * @param {USBDevice} device - 対象デバイス
 * @returns {Promise<object>} interfaceNumber / endpointIn / endpointOut
 */
const setup = async device => {
    const configuration = device.configurations[0];
    const confValue = configuration.configurationValue || 1;
    const usbInterface = configuration.interfaces[0];
    const endpointIn = getBulkEndpoint(usbInterface, 'in').endpointNumber;
    const endpointOut = getBulkEndpoint(usbInterface, 'out').endpointNumber;

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
const ACK = [0x00, 0x00, 0xff, 0x00, 0xff, 0x00];
const SET_COMMAND_TYPE = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00];
const SWITCH_RF = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00];
const IN_SET_RF_FELICA = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00];
const IN_SET_PROTOCOL_1 = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01,
    0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00,
    0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06,
    0x4b, 0x00];
const IN_SET_PROTOCOL_2 = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18, 0x10, 0x00];
const IN_COMM_RF_FELICA_POLLING = [
    0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00, 0x06, 0x00, 0xff, 0xff,
    0x01, 0x00, 0xb3, 0x00];

const readIdm = async (device, claimed) => {
    const endpointOut = claimed.endpointOut;
    const endpointIn = claimed.endpointIn;

    await send(device, endpointOut, ACK);
    await send(device, endpointOut, SET_COMMAND_TYPE);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, SWITCH_RF);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, SWITCH_RF);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, IN_SET_RF_FELICA);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, IN_SET_PROTOCOL_1);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, IN_SET_PROTOCOL_2);
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    await send(device, endpointOut, IN_COMM_RF_FELICA_POLLING);
    await receive(device, endpointIn, 6);

    const idm = (await receive(device, endpointIn, 37)).slice(17, 25);
    if (idm.length > 0) {
        return bytesToHex(idm);
    }
    return '';
};

export default {productIds, setup, readIdm};
