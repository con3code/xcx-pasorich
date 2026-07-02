/*
//
// PaSoRich for Xcratch
// 20260703 - 2.1(2607)
//
// SONY PaSoRi (RC-S380 / RC-S300) から FeliCa の IDm を WebUSB で読み取る。
// リーダー機種ごとの通信処理は s380-driver.js / s300-driver.js に分離。
//
*/


import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './pasorich_icon.png';

import s380Driver from './s380-driver';
import s300Driver from './s300-driver';

const SONY_VENDOR_ID = 0x054c;

/**
 * 対応リーダーのドライバ一覧。
 * 新機種対応はドライバモジュールを追加してここに登録する。
 * (RC-S320: 0x01bb / RC-S330: 0x02e1 は通信プロトコル未実装のため対象外)
 */
const drivers = [s380Driver, s300Driver];

/**
 * requestDevice() 用のフィルター。対応機種の productId だけを列挙する。
 */
const usbFilters = drivers.reduce((filters, driver) => filters.concat(
    driver.productIds.map(productId => ({vendorId: SONY_VENDOR_ID, productId: productId}))
), []);

/**
 * productId に対応するドライバを返す。
 * @param {number} productId - USB productId
 * @returns {object} ドライバモジュール (未対応なら undefined)
 */
const findDriver = productId => drivers.find(d => d.productIds.includes(productId));

/**
 * 接続済みデバイスのリスト。
 * 各要素: {device: USBDevice, driver: object, claimed: object|null, idmNum: string}
 * claimed はドライバの setup() が返す通信情報 (interfaceNumber / endpointIn / endpointOut)。
 */
const nfcDevices = [];
let deviceOpening = false;

const pasorichVersion = 'PaSoRich 2.1(2607)';


/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.defaultMessage;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'pasorich';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://con3code.github.io/xcx-pasorich/dist/pasorich.mjs';

let isConnect = formatMessage({
    id: 'pasorich.push2Connect',
    default: 'Push to Connect.',
    description: 'push2Connect'
});

/**
 * デバイス選択ダイアログを表示し、選択されたデバイスをリストに登録する。
 * すでに登録済みのデバイスが選ばれた場合は何もしない。
 * @returns {Promise<USBDevice|null>} 追加したデバイス (登録済みなら null)
 */
const requestNewDevice = async () => {
    const device = await navigator.usb.requestDevice({filters: usbFilters});
    const existingEntry = nfcDevices.find(entry => entry.device === device);
    if (existingEntry) {
        return null;
    }
    const driver = findDriver(device.productId);
    if (!driver) {
        // フィルターで絞っているため通常は起こらない
        throw new Error(`Unsupported device: ${device.productName}`);
    }
    nfcDevices.push({device: device, driver: driver, claimed: null, idmNum: ''});
    return device;
};

/**
 * デバイス番号 (1 始まり) からデバイスエントリーを取得する。
 * @param {number} deviceNumber - デバイス番号
 * @returns {object} デバイスエントリー (範囲外なら null)
 */
const getEntryByNumber = deviceNumber => {
    if (deviceNumber > 0 && deviceNumber <= nfcDevices.length) {
        return nfcDevices[deviceNumber - 1];
    }
    return null;
};


/**
 * Scratch 3.0 blocks for PaSoRich.
 */
class Scratch3PasorichBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'pasorich.name',
            default: 'PaSoRich',
            description: 'name of the extension'
        }).toString();
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for PaSoRich.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // whenRead ハットブロックごとの読み取りイベントキュー
        this.whenReadCountMap = new Map();

        console.log(pasorichVersion);

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }
    }


    /**
     * デバイス選択ダイアログを開いてリーダーを追加登録する。
     * @returns {Promise<string>} 接続状態メッセージ
     */
    openPasori () {
        if (deviceOpening) {
            // すでに選択ダイアログを開いている間は何もしない
            return isConnect;
        }
        deviceOpening = true;
        return requestNewDevice()
            .then(() => {
                isConnect = formatMessage({
                    id: 'pasorich.ConnectConnected',
                    default: 'Connected...',
                    description: 'ConnectConnected'
                });
                return isConnect;
            })
            .catch(error => {
                // ユーザーがダイアログをキャンセルした場合など
                console.error('openPasori:', error);
                return isConnect;
            })
            .finally(() => {
                deviceOpening = false;
            });
    }


    /*
        readPasori(args) // -> Scratch3PasorichBlocks.prototype.readPasori
    */


    getIdm (args) {
        const entry = getEntryByNumber(parseInt(args.DEVICE_NUMBER, 10));
        return entry ? entry.idmNum : null;
    }


    resetIdm () {
        nfcDevices.forEach(entry => {
            entry.idmNum = '';
        });
        console.log('resetIdm');
    }


    /**
     * すべてのデバイスを解放してリストを空にする。
     * @returns {Promise} 完了で resolve する Promise
     */
    async resetDevice () {
        for (const entry of nfcDevices) {
            try {
                if (entry.device.opened) {
                    if (entry.claimed) {
                        await entry.device.releaseInterface(entry.claimed.interfaceNumber);
                    }
                    await entry.device.close();
                }
            } catch (error) {
                console.error('resetDevice:', error);
            }
        }
        nfcDevices.splice(0, nfcDevices.length);
        console.log('resetDevices');
    }


    /*
        whenRead(args, util) // -> Scratch3PasorichBlocks.prototype.whenRead
    */


    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: Scratch3PasorichBlocks.EXTENSION_ID,
            name: Scratch3PasorichBlocks.EXTENSION_NAME,
            extensionURL: Scratch3PasorichBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            color1: '#608DD3',
            color2: '#608DD3',
            blocks: [
                {
                    opcode: 'openPasori',
                    text: formatMessage({
                        id: 'pasorich.Connect',
                        default: 'Connect',
                        description: 'openPasori'
                    }),
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'readPasori',
                    text: formatMessage({
                        id: 'pasorich.readPasori',
                        default: 'read #[DEVICE_NUMBER]reader',
                        description: 'readPasori'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        DEVICE_NUMBER: {
                            type: ArgumentType.STRING,
                            menu: 'deviceNumberMenu',
                            defaultValue: '1' // デフォルトのデバイス番号
                        }
                    }
                },
                {
                    opcode: 'getIdm',
                    text: formatMessage({
                        id: 'pasorich.getIdm',
                        default: 'IDm of #[DEVICE_NUMBER]',
                        description: 'getIDm'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        DEVICE_NUMBER: {
                            type: ArgumentType.STRING,
                            menu: 'deviceNumberMenu',
                            defaultValue: '1' // デフォルトのデバイス番号
                        }
                    }
                },
                '---',
                {
                    opcode: 'resetIdm',
                    text: formatMessage({
                        id: 'pasorich.resetIdm',
                        default: 'reset IDm',
                        description: 'reset IDm Variables'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'resetDevice',
                    text: formatMessage({
                        id: 'pasorich.resetDevice',
                        default: 'reset Device',
                        description: 'reset Devices'
                    }),
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'whenRead',
                    blockType: BlockType.HAT,
                    text: formatMessage({
                        id: 'pasorich.whenRead',
                        default: 'when read #[DEVICE_NUMBER]reader',
                        description: 'whenRead'
                    }),
                    arguments: {
                        DEVICE_NUMBER: {
                            type: ArgumentType.STRING,
                            menu: 'deviceNumberMenu',
                            defaultValue: '1' // デフォルトのデバイス番号
                        }
                    }
                }

            ],
            menus: {
                deviceNumberMenu: {
                    acceptReporters: true,
                    items: 'getDeviceNumberMenuItems'
                }
            }
        };
    }


    // デバイス番号メニューの項目を生成する関数
    getDeviceNumberMenuItems () {
        if (nfcDevices.length === 0) {
            // デバイスが登録されていない場合は空の配列を返す
            return [{
                text: ' ',
                value: ' '
            }];
        }
        return nfcDevices.map((_, index) => ({
            text: (index + 1).toString(),
            value: (index + 1).toString()
        }));
    }

}


class AsyncQueue {
    constructor () {
        this.queue = [];
        this.pendingPromise = false;
    }

    enqueue (task) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => task().then(resolve)
                .catch(reject));

            if (!this.pendingPromise) {
                this.pendingPromise = true;
                this.dequeue();
            }
        });
    }

    async dequeue () {
        if (this.queue.length === 0) {
            this.pendingPromise = false;
            return;
        }

        const task = this.queue.shift();
        try {
            await task();
        } catch (e) {
            console.error('Error during async task execution:', e);
        } finally {
            this.dequeue();
        }
    }
}


// 読み取り処理を直列化するキュー
const readPasoriQueue = new AsyncQueue();


// 実際のreadPasoriの処理を行う関数
Scratch3PasorichBlocks.prototype.readPasoriTask = async function (deviceNumber) {
    if (deviceNumber > nfcDevices.length) {
        // 未登録の番号が指定された場合は新しいデバイスの接続を求める
        await requestNewDevice();
        isConnect = formatMessage({
            id: 'pasorich.ConnectConnected',
            default: 'Connected...',
            description: 'ConnectConnected'
        });
    }

    const entry = getEntryByNumber(deviceNumber);
    if (!entry) {
        console.error('Invalid device number:', deviceNumber);
        throw new Error('Invalid device');
    }

    // 未接続 (または resetDevice 後) ならセットアップする
    if (!entry.claimed || !entry.device.opened) {
        entry.claimed = await entry.driver.setup(entry.device);
    }

    entry.idmNum = await entry.driver.readIdm(entry.device, entry.claimed);
    console.log('IDm #', deviceNumber, ': ', entry.idmNum,
        '(', entry.device.productName, ':', entry.device.serialNumber, ')');

    this.pasoriReadCallback(deviceNumber);
};


// readPasori関数でreadPasoriTaskをキューに積む
Scratch3PasorichBlocks.prototype.readPasori = function (args) {
    const deviceNumber = parseInt(args.DEVICE_NUMBER, 10);
    // 登録済みデバイス + 新規接続 1 台分だけを受け付ける
    if (isNaN(deviceNumber) || deviceNumber <= 0 || deviceNumber > nfcDevices.length + 1) {
        return;
    }
    return readPasoriQueue.enqueue(() => this.readPasoriTask(deviceNumber))
        .catch(error => {
            console.error('readPasori:', error);
        });
};


Scratch3PasorichBlocks.prototype.pasoriReadCallback = function (deviceNumber) {
    this.whenReadCountMap.forEach((readList, blockId) => {
        // readListが配列でない場合は新しい配列を割り当てる
        if (!Array.isArray(readList)) {
            readList = [];
            this.whenReadCountMap.set(blockId, readList);
        }
        readList.push(deviceNumber);
    });
};


// whenReadCalled関数で、readList配列を参照し、deviceNoを確認
Scratch3PasorichBlocks.prototype.whenReadCalled = function (blockId, deviceNo) {
    const readList = this.whenReadCountMap.get(blockId) || [];
    if (readList.length > 0) {
        // deviceNoがreadListの先頭にある場合、それを削除
        const deviceNumber = readList.shift();
        this.whenReadCountMap.set(blockId, readList);
        // deviceNumber は数値、deviceNo はブロック引数の文字列なので文字列同士で比較する
        return String(deviceNumber) === String(deviceNo);
    }
    this.whenReadCountMap.set(blockId, readList);
    return false;
};


// whenRead関数で、whenReadCalledの戻り値を利用
Scratch3PasorichBlocks.prototype.whenRead = function (args, util) {
    const blockId = util.thread.topBlock;
    const deviceNo = args.DEVICE_NUMBER;
    return this.whenReadCalled(blockId, deviceNo);
};


export {
    Scratch3PasorichBlocks as default,
    Scratch3PasorichBlocks as blockClass
};
