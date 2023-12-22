/*
//
// PaSoRich for Xcratch
// 20231222 - 2.0(2003)
//
//
*/


import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import translations from './translations.json';
import blockIcon from './pasorich_icon.png';
// import Cast from '../../util/cast';


// Variables
const pasoriDevice = {
    443 : {
        vendorId: 0x054c,
        productId: 0x01bb,
        modelType: '320',
        modelName: 'RC-S320',
        endpointInNum: '',
        endpointOutNum: ''
    },
    737 : {
        vendorId: 0x054c,
        productId: 0x02e1,
        modelType: '330',
        modelName: 'RC-S330',
        endpointInNum: '',
        endpointOutNum: ''
    },
    1729 : {
        vendorId: 0x054c,
        productId: 0x06C1,
        modelType: '380S',
        modelName: 'RC-S380/S',
        endpointInNum: '',
        endpointOutNum: ''
    },
    1731 : {
        vendorId: 0x054c,
        productId: 0x06C3,
        modelType: '380P',
        modelName: 'RC-S380/P',
        endpointInNum: '',
        endpointOutNum: ''
    },
    3528 : {
        vendorId: 0x054c,
        productId: 0x0dc8,
        modelType: '300S',
        modelName: 'RC-S300/S',
        endpointInNum: '',
        endpointOutNum: ''
    },
    3529 : {
        vendorId: 0x054c,
        productId: 0x0dc9,
        modelType: '380P',
        modelName: 'RC-S300/P',
        endpointInNum: '',
        endpointOutNum: ''
    },
}

let nfcDevices = [];
let deviceOpening = false;
let seqNumber = 0 ;

const pasorichVersion = 'PaSoRich 2.0(2003)';


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

/**
 * Scratch 3.0 blocks for example of Xcratch.
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

        //
        this.whenReadCountMap = new Map(); 
        this.allHatBlocksDone_flag = false; // すべてのwhenReadハットブロックが呼ばれたかチェック用

        console.log(pasorichVersion);


        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }


    }

 
    openPasori () {
        if(deviceOpening) {deviceWaiter(1);}

        if(nfcDevices.length > 0) {
            isConnect = formatMessage({
                id: 'pasorich.ConnectConnected',
                default: 'Connected...',
                description: 'ConnectConnected'
            });
        } else {
            isConnect = formatMessage({
                id: 'pasorich.ConnectConnecting',
                default: 'Connecting...',
                description: 'ConnectConnecting'
            });

        }

        return new Promise((resolve, reject) => {
            deviceOpening = true;
            // console.log("openPasori:", device);

            // 新しいデバイスをリクエストして配列に追加
            navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c }] })
                .then(device => {
                    // console.log("requestDevice:", nfcDevices);
                    const existingDevice = nfcDevices.find(d => d && d.device.serialNumber === device.serialNumber);
                    // console.log("existingDevice:", existingDevice);
                    if (existingDevice) {
                        // デバイスがすでに存在する場合は何もせずに false を返す
                        deviceOpening = false;
                        resolve(false);

                    } else {

                        // console.log("openPasori:", device);
                        addNfcDevice(device);
                        this.getDeviceNumberMenuItems();
                        isConnect = formatMessage({
                            id: 'pasorich.ConnectConnected',
                            default: 'Connected...',
                            description: 'ConnectConnected'
                        });
                        deviceOpening = false;
                        resolve(isConnect);
                    }
                })
                .catch(error => {
                    deviceOpening = false;
                    reject(error);
                });

                this.getDeviceNumberMenuItems();
                resolve(isConnect);
        });

    }


/*

    readPasori(args) // -> Scratch3PasorichBlocks.prototype.readPasori

*/

    
    getIdm (args) {
        return getIdmNum(args.DEVICE_NUMBER);
    }
    
    
    resetIdm () {
        return new Promise((resolve, reject) => {
            if (nfcDevices.length != 0) {
                nfcDevices.forEach(async nfc => {
                    nfc.idmNum = '';
                });
                console.log("resetIdm");
                // resolve();
            }
            resolve();
        });
    }
    


    resetDevice () {
        return new Promise((resolve, reject) => {
            if (nfcDevices.length != 0) {
                nfcDevices.forEach(async nfc => {
                    nfc.idmNum = '';
                    let confValue = nfc.device.configurations[0].configurationValue || 1;
                    let interfaceNum = nfc.device.configurations[0].interfaces[confValue - 1].interfaceNumber || 0;
                    await nfc.device.releaseInterface(interfaceNum);
                    await nfc.device.close();
                });
                nfcDevices.splice(0, nfcDevices.length);
                this.getDeviceNumberMenuItems();
                console.log("resetDevices");
                // resolve();
            }
            resolve();
        });
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
                    blockType: BlockType.COMMAND,
                },
                {
                    opcode: 'resetDevice',
                    text: formatMessage({
                        id: 'pasorich.resetDevice',
                        default: 'reset Device',
                        description: 'reset Devices'
                    }),
                    blockType: BlockType.COMMAND,
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
                },

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
        // console.log("getDeviceNumberMenuItems:", nfcDevices.length);
        if (nfcDevices.length === 0) {
            // デバイスが登録されていない場合は空の配列を返す
            return [{
                text: ' ',
                value: ' '
            }];
        } else {
            return nfcDevices.map((_, index) => ({
                text: (index + 1).toString(),
                value: (index + 1).toString()
            }));
    
        }
    }


}



class AsyncQueue {
    constructor() {
        this.queue = [];
        this.pendingPromise = false;
    }

    async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => task().then(resolve).catch(reject));

            if (!this.pendingPromise) {
                this.pendingPromise = true;
                this.dequeue();
            }
        });
    }

    async dequeue() {
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


let isConnect = formatMessage ({
    id: 'pasorich.push2Connect',
    default: 'Push to Connect.',
    description: 'push2Connect'
});

const getEndpoint = (argInterface, argValue) => {
    let retValue = false;
    for(const val of argInterface.alternate.endpoints) {
        if (val.direction == argValue && val.type == 'bulk') {
            // console.log(val);
            retValue = val;
        }
    }
    return retValue;
}


async function setupDevice (device) {
    const modelType = device.productId;
    const pasoriDeviceModel = pasoriDevice[modelType];
    let deviceInterface;

    console.log("setupDevice:", device);
    const confValue = device.configurations[0].configurationValue || 1;
    console.log("configurationValue:", confValue);

    // RC-S300
    if (device.productId === 0x0dc8 || device.productId === 0x0dc9) {
        deviceInterface = device.configuration.interfaces.filter(v => v.alternate.interfaceClass == 255)[0];	// インターフェイス番号
        pasoriDeviceModel.endPointInNum = deviceInterface.alternate.endpoints.filter(e => e.direction == 'in')[0].endpointNumber;
        pasoriDeviceModel.endPointOutNum = deviceInterface.alternate.endpoints.filter(e => e.direction == 'out')[0].endpointNumber;
    }

    // RC-S380
    if (device.productId === 0x06C1 || device.productId === 0x06C3) {
        deviceInterface = device.configurations[0].interfaces[0];	// インターフェイス番号
        let deviceEndpoint = await getEndpoint(deviceInterface, 'in');
            pasoriDeviceModel.endPointInNum = deviceEndpoint.endpointNumber;
            // console.log("endpointInNumber:", pasoriDeviceModel.endPointInNum);
            deviceEndpoint = await getEndpoint(deviceInterface, 'out');
            pasoriDeviceModel.endPointOutNum = deviceEndpoint.endpointNumber;
            // console.log("endpointOutNumber:", pasoriDeviceModel.endPointOutNum);
    }

    console.log("interfaceNumber:", deviceInterface.interfaceNumber);


    try {
        await device.open(); // デバイスを開く
        await device.selectConfiguration(confValue);
        await device.claimInterface(deviceInterface.interfaceNumber);
    } catch (error) {
        console.error('This device is currently in use or down:', error);
    }
    return device;
}



// キューインスタンスを作成
const readPasoriQueue = new AsyncQueue();


// 実際のreadPasoriの処理を行う関数
Scratch3PasorichBlocks.prototype.readPasoriTask = function (deviceNumber) {
    return new Promise((resolve, reject) => {
        // console.log("readPasoriTask:", args.DEVICE_NUMBER);
        // if (args.DEVICE_NUMBER === '') { resolve('No Device'); }

        // const deviceNumber = parseInt(args.DEVICE_NUMBER, 10);
        if (deviceNumber > 0 && deviceNumber <= nfcDevices.length) {
            const device = getNfcDeviceByNumber(deviceNumber);
            //console.log("readOpenPasori:", device);
            if (device) {
                if (device.opened) {
                    // デバイスが既に開かれている場合は、直接 session 処理を行う
                    session(device)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // デバイスが開かれていない場合は、セットアップを行う
                    setupDevice(device)
                        .then(() => session(device))
                        .then(resolve)
                        .catch(error => {
                            console.error('Failed to setup or session the device:', error);
                            reject(error);
                        });
                }
            } else {
                console.error('Invalid device number');
                reject('Invalid device');
            }
    
        } else {
            // 新しいデバイスをリクエストして配列に追加する
            navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c }] })
                .then(device => {
                    // console.log("requestDevice:", nfcDevices);
                    const existingDevice = nfcDevices.find(d => d && d.device.serialNumber === device.serialNumber);
                    // console.log("existingDevice:", existingDevice);
                    if (existingDevice) {
                        // デバイスがすでに存在する場合は何もせずに false を返す
                        // deviceOpening = false;

                    } else {

                        // console.log("readSetPasori:", device);
                        addNfcDevice(device);
                        this.getDeviceNumberMenuItems();
                        isConnect = formatMessage({
                            id: 'pasorich.ConnectConnected',
                            default: 'Connected...',
                            description: 'ConnectConnected'
                        });
                        // deviceOpening = false;
                    }
                })
                .then(() => {
                    const device = getNfcDeviceByNumber(deviceNumber);
                    // console.log("readOpenPasori:", device);
                    if (device) {
                        if (device.opened) {
                            // デバイスが既に開かれている場合は、直接 session 処理を行う
                            session(device)
                                .then(resolve)
                                .catch(reject);
                        } else {
                            // デバイスが開かれていない場合は、セットアップを行う
                            setupDevice(device)
                                .then(() => session(device))
                                .then(resolve)
                                .catch(error => {
                                    console.error('Failed to setup or session the device:', error);
                                    reject(error);
                                });
                        }
                    } else {
                        console.error('Invalid device number');
                        reject('Invalid device');
                    }
            
                })
                .catch(error => {
                    // deviceOpening = false;
                    reject(error);
                });

                this.getDeviceNumberMenuItems();
        }
    })
    .then(() => {
        this.pasoriReadCallback(deviceNumber);
    });
};



// readPasori関数でpasoriReadCallbackを呼び出し
Scratch3PasorichBlocks.prototype.readPasori = function (args) {
    const deviceNumber = args.DEVICE_NUMBER;
    if (deviceNumber <= 0 && deviceNumber > nfcDevices.length + 1) {return;}
    return readPasoriQueue.enqueue(() => {
        // console.log("readPasori:", deviceNumber);
        return this.readPasoriTask(deviceNumber);
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
        let deviceNumber = readList[0];
        readList.shift();
        this.whenReadCountMap.set(blockId, readList);
        return deviceNumber == deviceNo;
    } else {
        this.whenReadCountMap.set(blockId, readList);
        // console.log("whenReadCalled:", readList);
    }
    return false;
};


// whenRead関数で、whenReadCalledの戻り値を利用
Scratch3PasorichBlocks.prototype.whenRead = function (args, util) {
    const blockId = util.thread.topBlock;
    const deviceNo = args.DEVICE_NUMBER;
    // console.log("whenRead:", deviceNo);
    return this.whenReadCalled(blockId, deviceNo);
};



async function send300 (device, endpointOut, data) {
    let uint8data = new Uint8Array(data);
    const dataLength = uint8data.length;
    const SLOTNUMBER = 0x00;
    let reqPckt = new Uint8Array(10 + dataLength);
  
    reqPckt[0] = 0x6b;
    reqPckt[1] = 255 & dataLength;
    reqPckt[2] = dataLength >> 8 & 255;
    reqPckt[3] = dataLength >> 16 & 255;
    reqPckt[4] = dataLength >> 24 & 255;
    reqPckt[5] = SLOTNUMBER;
    reqPckt[6] = ++seqNumber;
  
    0 != dataLength && reqPckt.set(uint8data, 10);
    await device.transferOut(endpointOut, reqPckt);
    await sleep(20);
}

async function send (device, endpointOut, data) {
    let uint8data = new Uint8Array(data);
    await device.transferOut(endpointOut, uint8data);
    await sleep(10);
}
  
async function receive (device, endpointIn, len) {
    let data = await device.transferIn(endpointIn, len);
    await sleep(10);
    let arr = [];
    for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
        arr.push(data.data.getUint8(i));
    }
    return arr;
}



function padding_zero (num,p){
    return ("0".repeat(p*1) + num).slice(-(p*1));
}

function dec2HexString (n){
    return padding_zero((n*1).toString(16),2);
}

async function session (device) {
    // console.log("session IN");

    // console.log("session:", device.productId);
    let pasoriDeviceModel = pasoriDevice[device.productId];
    let endpointOut = pasoriDeviceModel.endPointOutNum;
    // console.log("session_endPointOutNum:", pasoriDeviceModel.endPointOutNum);
    let endpointIn = pasoriDeviceModel.endPointInNum;
    // console.log("session_endPointInNum:", pasoriDeviceModel.endPointInNum);


    // RC-S300
    if (device.productId === 0x0dc8 || device.productId === 0x0dc9) {

        // console.log("RC-S300");

        const len = 50;

        // console.log("session_endPointOutNum:", endpointOut);
        // console.log("session_endPointInNum:", endpointIn);
    
        // firmware version
        // await send300(device, endpointOut, [0xFF, 0x56, 0x00, 0x00]);
        // await receive(device, endpointIn, len);
      
        // endtransparent
        await send300(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
        await receive(device, endpointIn, len);
        
        // startransparent
        await send300(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]);
        await receive(device, endpointIn, len);
      
        // rf off
        await send300(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
        await receive(device, endpointIn, len);
      
        // rf on
        await send300(device, endpointOut, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]);
        await receive(device, endpointIn, len);
      
        // SwitchProtocolTypeF
        await send300(device, endpointOut, [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]);
        await receive(device, endpointIn, len);
      
        // ferica poling
        await send300(device, endpointOut, [0xFF, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5F, 0x46, 0x04, 0xA0, 0x86, 0x01, 0x00, 0x95, 0x82, 0x00, 0x06, 0x06, 0x00, 0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00]);

        const poling_res_f = await receive(device, endpointIn, len);

        if(poling_res_f.length == 46){
            let idmStr = '';
            let idm = poling_res_f.slice(26,34).map(v => dec2HexString(v));
            idmStr = idm.join('');
            let idmNum = JSON.parse(JSON.stringify(idmStr));
            await setIdmNum(device, idmNum);
            return;
        } else {
            await setIdmNum(device, '');
        }
    }


    // RC-S380
    if (device.productId === 0x06C1 || device.productId === 0x06C3) {

        // console.log("RC-S380");

        // console.log("session_endPointOutNum:", endpointOut);
        // console.log("session_endPointInNum:", endpointIn);

        await send(device, endpointOut, [0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]); //SetCommandType
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 1");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]); //SwitchRF
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 2");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]); //SwitchRF
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 3");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00]); //InSetRF
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 4");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06, 0x4b, 0x00]); //InSetProtocol
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 5");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18, 0x10, 0x00]); //InSetProtocol
        await receive(device, endpointIn, 6);
        await receive(device, endpointIn, 13);
        // console.log("session IN 6");
        await send(device, endpointOut, [0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00, 0xb3, 0x00]); //InCommRF
        await receive(device, endpointIn, 6);
    
        // console.log("session Idm");
        let idm = (await receive(device, endpointIn, 37)).slice(17, 25);

        if (idm.length > 0) {
            let idmStr = '';
            for (let i = 0; i < idm.length; i++) {
                if (idm[i] < 16) {
                    idmStr += '0';
                }
                idmStr += idm[i].toString(16);
            }
            let idmNum = JSON.parse(JSON.stringify(idmStr));
            await setIdmNum(device, idmNum);
        } else {
            await setIdmNum(device, '');
        }
    
    }

}


// 特定のデバイスのidmNumを取得する関数
function getIdmNum (deviceNumber) {
    // console.log("getIdmNum:", deviceNumber);
    if (deviceNumber > 0 && deviceNumber <= nfcDevices.length) {
        return nfcDevices[deviceNumber - 1].idmNum;
    }
    return null; // 範囲外の場合はnullを返す
}


// 特定のデバイスのidmNumを設定する関数
function setIdmNum (device, idmNum) {
    const deviceIndex = nfcDevices.findIndex(d => d.device && d.device.serialNumber === device.serialNumber);
    console.log("IDm #", deviceIndex + 1, ": ", idmNum, "(", device.productName, ":", device.serialNumber, ")");
    if (deviceIndex !== -1) {
        nfcDevices[deviceIndex].idmNum = idmNum;
    }
}


function addNfcDevice (device) {
    if (device instanceof USBDevice) {
        // 通常のデバイスを追加する処理
        const existingDevice = nfcDevices.find(d => d && d.serialNumber === device.serialNumber);
        if (existingDevice) {
            // デバイスがすでに存在する場合は何もせずに false を返す
            return false;
        }
        // デバイスとそれに関連するidmNumをオブジェクトとして配列に追加
        nfcDevices.push({ device: device, idmNum: '' });
        return true;
    } else {
        console.error('The provided object is not a USBDevice instance.');
    }
}


// デバイスを取得する関数（番号で取得）
function getNfcDeviceByNumber (deviceNumber) {
    if (deviceNumber > 0 && deviceNumber <= nfcDevices.length) {
        // deviceNumber は配列のインデックスとして機能
        return nfcDevices[deviceNumber - 1].device;
    }
}
 

// デバイスを削除する関数（番号で削除）
function removeNfcDeviceByNumber (deviceNumber) {
    if (deviceNumber > 0 && deviceNumber <= nfcDevices.length) {
        let device = nfcDevices[deviceNumber - 1];
        if (device.opened) {
            device.close();
        }
        // 配列から要素を削除
        nfcDevices.splice(deviceNumber - 1, 1);
    }
}

// すべてのデバイスを閉じて削除する関数
function clearNfcDevices () {
    nfcDevices.forEach(device => {
        if (device.opened) {
            device.close();
        }
    });
    // 配列を空にする
    nfcDevices = [];
}


function sleep (msec) {
    return new Promise(resolve =>
        setTimeout(() => {
            resolve();
        }, msec)
    );
}

function deviceWaiter (msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (!deviceOpening) {
                reject();
            } else {
                resolve();
            }
        }, msec)
    )
        .catch(() => {
            return deviceWaiter(msec);
        });
}



function hexString (textStr) {
    const byteArray = new Uint8Array(textStr);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}

/*
        if (!crypto || !crypto.subtle) {
            throw Error("crypto.subtle is not supported.");
        }

        crypto.subtle.digest('SHA-256', new TextEncoder().encode(idmNum))
        .then(idmNumStr => {
            idmNumSha256 = hexString(idmNumStr);
            //console.log("HashedIDm: " + idmNumSha256);
        });

*/


export {
    Scratch3PasorichBlocks as default,
    Scratch3PasorichBlocks as blockClass
};
