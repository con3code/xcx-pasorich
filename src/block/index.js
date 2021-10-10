const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
// const cast = require('../../util/cast');
// const log = require('../../util/log');


// Variables
let pasoriDevice;
let idmNum = '';
let idmNumSha256 = '';
let globalCpyRcvArray = '';
let deviceFlag = false;
let readingFlag = false;
let inoutFlag = false;
let connectingCount = 0;
const intvalTimeShort = 12;
const PaSoRichVersion = "PaSoRich 0.7.1";



/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {*} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const EXTENSION_ID = 'pasorich';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://con3office.github.io/xcx-pasorich/dist/pasorich.mjs';

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
//const blockIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAABgWlDQ1BzUkdCIElFQzYxOTY2LTIuMQAAKJF1kctLQkEUh7+0MHpgUESLFhLWSsMKpDZBRlggEWbQa6PXV6B2ufdGRNugrVAQtem1qL+gtkHrICiKINoFrYvalNzOVUGJPMOZ881v5hxmzoAtklGyer0PsjlDCwcDrvmFRZfjFTsObHTiiSq6OjYzE6KmfT1QZ8U7r1Wr9rl/rTme0BWoaxQeVVTNEJ4UDq0bqsW7wh1KOhoXPhf2aHJB4XtLj5X4zeJUiX8s1iLhcbC1CbtSVRyrYiWtZYXl5bizmTWlfB/rJS2J3NysxB7xbnTCBAngYooJxvEzwIjMfrwM0i8rauT7ivnTrEquIrPKBhorpEhj4BF1TaonJCZFT8jIsGH1/29f9eTQYKl6SwAaXkzzoxccO1DIm+b3sWkWTsD+DFe5Sv7qEQx/ip6vaO5DcG7BxXVFi+3B5TZ0PalRLVqU7OK2ZBLez6B1AdpvoWmp1LPyPqePENmUr7qB/QPok/PO5V8gz2fGkateTgAAAAlwSFlzAAALEwAACxMBAJqcGAAACQxJREFUWIXtmGt0VdURx39zzrkX8oLwSIhY3iAokYURsBBsQCO2aitraavL1mWF2pZVUFFpfdtWHtaqYMUlaGm11epCq/XRWqmIAUHDS40QgzwUECQYSCCQ1z3nTD/sc869NwkBvrD6obPW+bBnz+z579lnZs9s+B8nOdUGVfV04GLgwoB1APgAeFFEEqcaTyowR1XvVVVX26fdqnpta72T8qCq5gNXAP0AF9gHLBWR/cfRiwNvAhdEvMYD4DUh8RyId0kVv0lE/nAyuFDVXFV9UVW9dnaeUNXnVTX3GLqWqj4QCvs1mzWxYoY2vzDOfEtLNLF2rvoNX6eu+d1Q/7geVNUzgDeAIRHTbQSxwO6UKloJXCIiO1N0beAR4BeArXXbSLx9A3gtbexI7mBiFy4CJwNgPTBGRLRDgKrqAOuAkQD+npV4lc+gtZ8BguQOxi78CVbvcaHKF8AoETmgqt2B54FJAHpoB+67N6FNBw2gnD5ITl/8mk3QcggAe+hV2CNvDNcqFpE1VkcAgZ+H4Lyq53DfuwM9WAXqg3po7RbcVbPwPv1rKN8fWKqqhUB5BK5uG+7KWyNwVsFoYhctwTn/QWITH41Owv+qPNX2EIDjAZwKoA3VeBWLI6ZkFSA5faKxV7EIf+eycHgBsBEYDODvfofE2z9DG0wcSe5gnOJ5EMsKxkOQWDYAeuRLs3lDvQGcYyFT1U5AIYC//TVQz+x+0GScUbNAfbzKp/E2LQHAXTePWE5fpPswgBjq4236I17lM8mN5Q7BOf/B8D8zdup3oy2HzXzXQebfNlQNHXuwT7SBRH3EtAdcElizsIdPwer/bTP2WkiU3YIe2g5uI+7qu9LAWX1LiZUuRjLzkxZa6nFXzQLf5GfrtLGp9ldABx4EdgM+YKXu2K9ej91jeDR2Rt9Oon4XeqASWg6ReGc60ikXrd+V3MjZP8U+s1UOVh93zV1o/W4j1qUf9pk/Cmc/FJHPoQMPikgzsB3AGnBZ5HoTxVuSglaMWMl8pNvQwCuHk+CcTJzieW3BtRzGLZuJX73BjONdUo9eMcFJhwADWgwmJVgDLjMcrxn3vTuguS4pFcsmNmEBkjs4ucGs04iVLsI6fXzaglq3jcSyKfjV66MNOsVzkexvhCL3iMjaaJ2O0AWBUgX0x2smsXxa5D3pcRaxCY+Ck5lUaD5EYsV0iOcQK54Hnbqmred/+S5u+f3gNhlGvCtO8Rys/HNCkeeAa0VETwhgALIEWA7Y2rAf9z9T0KZao9xzBLGSR9KiErfB5DWx09bxNv8Zb/OfojQiuUNwxs9Dsk4LRZYBl4tIU6reCRULqjodeAxAa7eQWHEjJI6YBfJGEit5GOzO7St7LbhrZ+PvWh6xrD4X4Jx3V6rOs8ANrcGdDEDBeHEigNZUkFgxA3zXGOxVhFOyoI3XtLnO3CAHqyKePXwKduGU0LQCvwQeTj3WVDpekIQ0LQSH12TyWwAOywmi3G6jJLHsZHQH5Fevj668AOU1wMBjGT6Rf/AmYAEAiSMkVs5CayrMpB3HGXt/m0htTf72V3E3zo8SsmT0xBl3P9JzRChyGLheRF4+KYCqeiXwIoA21eKWzUTrtppJJxNn/ANYvc5NB7N/I5LTH8nonr7WgU24q+80hSqYBD5iGvbQq1OvtwXAr0QkqseOCVBVv4m5bjqTOGJSzKEdZjLehVjJw0j3s9LBff4G7rrfIZ274xTPQXoUpq/ZeAB3zd3JEwCs3sU4592dWlWXA5eJSM0xAarqQEwjk4efwF15a5T1JaMHTskCpGv6b+NteQHvo4WY/x6TgItmYg26vNXiPl7FE3hVz0eyktkLZ9xspEe04feAUhFpbgNQVbsBa4BhoLhrH8D//I2k50oXIzl908F98lRQGLQNRGvQZJyimWClX/v+3tW45bMhqGSwHJzRt2P1/04o8riITE8DGDQ3bwETALzKv+B9sjjySGzCAiRvZDq4jfPxtr4Uje1hP0QTR/G3/yPiSc+zTVBk5KU74+g+3DX3oAcrkzYufALpfiZAA1AQ5YYg1y0BJgP4u97G2/BQaAJnzJ2tolVxy+fg73gtCW7ENOzCqVi9i5HMPPx95ebmaNiP/8W/TXGafXoSeDwbe8AlaFONaSPUR+t3Yg+4FCAGbEnNg3cD14FJxG757KTh4dcn677Qcx89hv/Fm8kNjJqVWi5hDfwesYkLkYyehhEkbe+Tp1KrZnO0594Wede0FF44O9AKvHcR8FswZXdi1e3JIrLfxdiFU9PA+dtextuyNMBm4Yy9D2vQ5HB6B7ABgqOd9DRWwejA6aYKd8tuTk3WYMXAjgeLJ8BrjpxsB63hS0ABLfW4K2ZAY9A/5I0kVjw3NU/hf/V+4F3jBbvoZuyBURtbgfl/Hwd6AqPFycDqNwnERvd/aHAe/QrduQzpnAvxrvifLcX/sszY7HYG9pArw/VeEVWdDLwCpvkJOzTJ6Uus9EmI50TgtG4bieXTTMUC2Gd8H/ucm8Ppj4GJIlIbyateAzwJZIG55rwPfh1VQ+2RM+aOsPZUoI8FFAHgNuJt/buRsjvhfOuhdHCNNaZ/CMBZvYtTe9g9wKWp4ABE5G/AKGAzgNVrFM6kZ7AKxrQLzh56dbIwhrdEZI8DDANMZxUazz8nLdpwG3FXzUq2jt2G4oz9TXj0RwJwe9ozKiJVqjoGc+w/Nol+Pv7+jfg7XjfFazwbe/AVYUcYbngqmKYpaNmSKVGP7DGRJLZpbt6/L3hNAMnMT+0ffOAqEfm4XZckQTYA16tqGTAfyLXyi7Dyi9oT34spXPeCKbdMxGXmRXer1u/GLZuJ9+mzJN66Dn/vaqPqZOKc//tk6oAZIvKvjsC1Avo0pqFfCBxtNV0LzAGGisiGSCd4HKoEbH9fOe7K29LzVEh23FQvBeeFnPkicsuJgmtNqmphnvH6A1uBPe0VrRIIPwLMBPCr1+GuuTd5RxJc5uPnpRafrwJXiIjHqSBVzVHVj6PXOa9F/a8r1Nv+uvoHq1S9ROrb3T9VNeuUAGsFMktVXzjG82xIi4MnuVNGrasZAcYCPwBKA3YLpmFaIiJV/J/S6b82VDQYGIn3DAAAAABJRU5ErkJggg==';
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwKSI+CjxwYXRoIGQ9Ik0yOS43ODc0IDM5LjgyQzI5LjAzMDYgMzkuODIgMTEuOTA1NCAzOS44MzMgMTEuMzIzNSAzOS44MkM5LjY5ODY4IDM5LjgyIDggMzUuODk1OSA4IDM0Ljc4NTNDOC4wMDE0NyAzNC43NTQ3IDkuMDcyNjYgNC45MTkxMSA5LjEwOTkxIDQuNjcxQzkuMTUyOTQgNC4zODQ1IDkuMjE0NjkgNC4wOTkyNSA5LjI5MTA4IDMuODE5NzJDOS40MTExNSAzLjM4MDM4IDkuNDkxODEgMy4wNTIyMiA5Ljg0NjM5IDIuNTc4MjdDMTAuMjg5NSAxLjk4NTk2IDEwLjc2MjQgMS4zMTkyNiAxMi40MzEzIDEuMzE5NkMxNS41MDMzIDEuMzIwMjQgMTQuNDA5OCAxLjI1OTE2IDE0LjgyMyAxLjI3MDMyQzE0Ljg4OTIgMS4yNzIxMSAxNC45MjY3IDEuMjY3NzkgMTQuOTE3MyAxLjE4NDY0QzE0Ljg4NzYgMC45MjQ0OTQgMTQuODYyOCAwLjY2Mzc3MSAxNC44Mzg0IDAuNDAzMDUyQzE0LjgzMDQgMC4zMTc0OTUgMTQuODI1NSAwLjIzMTI0MSAxNC44MjYxIDAuMTQ1MzUzQzE0LjgyODYgLTAuMjQwMzU3IDE0LjgzMzcgLTAuNjI2MDQ5IDE0LjgzNzcgLTEuMDExNzVDMTQuODM4IC0xLjAzOTM3IDE0LjgzNjIgLTEuMDY3MDkgMTQuODM3OSAtMS4wOTQ2MUMxNC44NDYxIC0xLjIyNTk2IDE0Ljg1NjMgLTEuMzU3MiAxNC44NjM2IC0xLjQ4ODYxQzE0Ljg3MzQgLTEuNjY0OSAxNC44NzE3IC0xLjg0MjQzIDE0Ljg5MiAtMi4wMTc0M0MxNC45Mjc5IC0yLjMyNjc1IDE0Ljk3NTYgLTIuNjM0NzMgMTUuMDIwNiAtMi45NDI5NUMxNS4wNTQgLTMuMTcyMzEgMTUuMDc5OCAtMy40MDM1OCAxNS4xMjg4IC0zLjYyOTdDMTUuMjE0OSAtNC4wMjc1MSAxNS4zMTc5IC00LjQyMTYyIDE1LjQxMDUgLTQuODE4MDZDMTUuNDkxMiAtNS4xNjM3MSAxNS41NzU5IC01LjUwODc5IDE1LjY0MjggLTUuODU3MjFDMTUuNjk5MSAtNi4xNTAxMiAxNS43MzQ0IC02LjQ0NzE5IDE1Ljc3NDkgLTYuNzQyOTdDMTUuNzk2OSAtNi45MDM1MiAxNS44MSAtNy4wNjUyOSAxNS44MjggLTcuMjI2NDFDMTUuODUzNiAtNy40NTY1NSAxNS44ODgxIC03LjY4NjA2IDE1LjkwMzUgLTcuOTE2ODZDMTUuOTE2MSAtOC4xMDYxMyAxNS44OTk3IC04LjI5NzIgMTUuOTA4NSAtOC40ODY5QzE1LjkxNjQgLTguNjU4NjYgMTUuOTU0MiAtOC44Mjk1NyAxNS45NTUyIC05LjAwMDk5QzE1Ljk1NyAtOS4zMDIwMyAxNS45NCAtOS42MDMxNyAxNS45MzI1IC05LjkwNDNDMTUuOTI5OSAtMTAuMDA1OCAxNS45Mzg5IC0xMC4xMDgxIDE1LjkzMDggLTEwLjIwOUMxNS45MDg1IC0xMC40ODU4IDE1Ljg4MDYgLTEwLjc2MjEgMTUuODUzNyAtMTEuMDM4NUMxNS44Mjg1IC0xMS4yOTc3IDE1LjgxNDYgLTExLjU1ODggMTUuNzcyOCAtMTEuODE1M0MxNS43MDU1IC0xMi4yMjg2IDE1LjYzMjMgLTEyLjY0MTkgMTUuNTM4MSAtMTMuMDQ5N0MxNS40MTQ2IC0xMy41ODM3IDE1LjI4MDkgLTE0LjExNjEgMTUuMTI3NyAtMTQuNjQyMkMxNS4wMDYyIC0xNS4wNTk0IDE0Ljg1MDYgLTE1LjQ2NjggMTQuNzA1IC0xNS44NzY3QzE0LjY4OTggLTE1LjkxOTQgMTQuNjUyMiAtMTUuOTQxMiAxNC43Mjk2IC0xNS45NDQ1QzE0Ljg1MjEgLTE1Ljk0OTcgMTQuOTc0MyAtMTUuOTYyIDE1LjA5NjcgLTE1Ljk2OTVDMTUuMjU1MiAtMTUuOTc5MiAxNS40MTM5IC0xNS45ODU1IDE1LjU3MjMgLTE1Ljk5NjNDMTUuNzYzMyAtMTYuMDA5MiAxNS43NzgxIC0xNS45OTggMTUuODAyMyAtMTUuODA5QzE1LjgwNTkgLTE1Ljc4MSAxNS44MTY4IC0xNS43NTQxIDE1LjgyMyAtMTUuNzI2M0MxNS45MDI5IC0xNS4zNjc3IDE1Ljk4NTEgLTE1LjAwOTYgMTYuMDYxNyAtMTQuNjUwM0MxNi4xNTk5IC0xNC4xODk5IDE2LjI0ODcgLTEzLjcyNzUgMTYuMzUwMiAtMTMuMjY3OUMxNi40NTc0IC0xMi43ODI1IDE2LjU3OTUgLTEyLjMwMDMgMTYuNjg2NSAtMTEuODE0OEMxNi44MTMyIC0xMS4yMzk2IDE2LjkyNzUgLTEwLjY2MTYgMTcuMDUzNSAtMTAuMDg2M0MxNy4xNDMzIC05LjY3NjMyIDE3LjI0ODMgLTkuMjY5NzEgMTcuMzM3OCAtOC44NTk2OUMxNy40NTU2IC04LjMxOTk5IDE3LjU2MzQgLTcuNzc4MDkgMTcuNjc4MiAtNy4yMzc3MkMxNy43OTc5IC02LjY3NDA0IDE3LjkyNDEgLTYuMTExNzMgMTguMDQxNSAtNS41NDc1N0MxOC4xNDE4IC01LjA2NTg2IDE4LjI0MTIgLTQuNTgzNzMgMTguMzI2OCAtNC4wOTkyOEMxOC4zOTg5IC0zLjY5MTI0IDE4LjQ1ODEgLTMuMjgwNTEgMTguNTA5MyAtMi44NjkyNUMxOC41NTQ2IC0yLjUwNDc5IDE4LjU4OTQgLTIuMTM4NTEgMTguNjEzMiAtMS43NzIwMkMxOC42MzQgLTEuNDUxMzEgMTguNjM3OCAtMS4xMjkyMiAxOC42NDA1IC0wLjgwNzY2MUMxOC42NDM4IC0wLjQzMTIwNCAxOC42NDk1IC0wLjA1NDExMzYgMTguNjMxOCAwLjMyMTY1NEMxOC42MTgzIDAuNjA5MzM2IDE4LjU3NjcgMC44OTYzNzggMTguNTMzMiAxLjE4MTVDMTguNTIxNiAxLjI1NzM3IDE4LjU0NjUgMS4yNDM2NyAxOC41OTEgMS4yNDM0MUMxOC43NzA1IDEuMjQyMzQgMTguOTUgMS4yNDA2NiAxOS4xMjk1IDEuMjQzNDFDMTkuNjEyMyAxLjI1MDgxIDI3LjI4NjMgMS4zNDE3MSAyNy43MzIyIDEuMzQ5MjFDMzAuMzc4MiAxLjM5MzY0IDMxLjA0MjkgMi41MDQyMyAzMS4zNTQyIDMuNTY0NDVDMzEuNjQyNSA0LjU0NjM2IDMxLjU3MjEgNC4zMzQxMSAzMS42MjA1IDQuNzM0ODZDMzEuNjY3IDUuMTE4OTkgMzEuNzIyOCA1LjUwMTAxIDMxLjcyMjcgNS44ODkzNUMzMS43MjI3IDYuMTAwNTMgMzIuNzM0OCAzNC42MDk0IDMyLjc0MTYgMzQuNzg1M0MzMi43NDE2IDM1Ljg5NTkgMzEuMTkwNiAzOS44MiAyOS43ODc0IDM5LjgyWiIgZmlsbD0iYmxhY2siLz4KPHBhdGggZD0iTTEzLjAwMDggMjguMzkyOEMxMy4wNTQ2IDI3LjU1MTkgMTMuMzQwOCAxMC45NDYzIDEzLjQ0ODQgOC40MjM0M0MxMy41NTYxIDUuOTAwNTkgMTQuOTAxNCA2LjA1ODI3IDE2LjMwMDUgNi4wNTgyN0MxNy42OTk2IDYuMDU4MjcgMjIuNTk2NSA2LjA1ODI3IDI0LjQ4IDYuMDU4MjdDMjYuMzYzNCA2LjA1ODI3IDI3LjExNzUgNi43NzMyOSAyNy4xNzQgOC40ODNDMjcuMjMwNCAxMC4xOTI3IDI3LjYyMDQgMjcuNjA0NCAyNy41MTI4IDI4LjM5MjhDMjYuNDM2NSAyOC4zOTI4IDEzLjgwOCAyOC40NDU0IDEzLjAwMDggMjguMzkyOFoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDAiPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==';


let isConnect = formatMessage({
    id: 'pasorich.push2Connect',
    default: 'Push to Connect.',
    description: 'push2Connect'
});


function hexString(textStr) {
    const byteArray = new Uint8Array(textStr);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode;
    });
    return hexCodes.join('');
}

function sleep(msec) {
    return new Promise(resolve =>
        setTimeout(() => {
            resolve();
        }, msec)
    );
}

function readingWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if(readingFlag){
                reject();
            }else{
                resolve();
            }
        }, msec)
    )
    .catch(() => {
        return readingWaiter(msec);
    });
}

function ioWaiter(msec) {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if(inoutFlag){
                reject();
            }else{
                resolve();
            }
        }, msec)
    )
    .catch(() => {
        return ioWaiter(msec);
    });
}


function send(sendDevice, data) {

    if(inoutFlag){return;}
    inoutFlag = true;

    let uint8a = new Uint8Array(data);

    return sendDevice.transferOut(2, uint8a)
    .catch((error) => {
        console.log(error);
    })
    .finally(() => {
        inoutFlag = false;
    });
}

function receive(receiveDevice, len, cpy) {

    if(inoutFlag){return;}
    inoutFlag = true;    

    let receiveData = receiveDevice.transferIn(1, len);

    while(receiveData == undefined){
        sleep(intvalTimeShort);
    }

    if(receiveData !== undefined){
        receiveData.then(result => {
            let rcvArray = [];
            for (let i = result.data.byteOffset; i < result.data.byteLength; i++) {
                rcvArray.push(result.data.getUint8(i));
            }
            if(cpy){
                globalCpyRcvArray = JSON.parse(JSON.stringify(rcvArray));
                //console.log("globalCpyRcvArray:" + globalCpyRcvArray);
            }
            return rcvArray;
        })
        .catch((error) => {
            console.log(error);
        })
        .finally (() => {
            inoutFlag = false;
        });
    }
}

function session(sessionDevice) {

    sleep(1).then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01, 0x0f, 0x01, 0x18, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06, 0x4b, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18, 0x10, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 13, false);
        return ioWaiter(1);
    })
    .then(() => {
        send(sessionDevice, [0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00, 0xb3, 0x00]);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 6, false);
        return ioWaiter(1);
    })
    .then(() => {
        receive(sessionDevice, 37, true);
        return ioWaiter(1);
    })
    .then(() => {

        //console.log(globalCpyRcvArray);

	    if (globalCpyRcvArray != undefined){
	        if (globalCpyRcvArray.length > 25){

	            let idm = globalCpyRcvArray.slice(17, 25);
        	    //console.log("sliced: " + idm);
                if (idm.length > 0) {
            	    let idmStr = '';
					for (let i = 0; i < idm.length; i++) {
                	    if (idm[i] < 16) {
                	        idmStr += '0';
						}
						idmStr += idm[i].toString(16);
					}
					//console.log("IDm: " + idmStr);
                    idmNum = JSON.parse(JSON.stringify(idmStr));


                    if (!crypto || !crypto.subtle) {
                        throw Error("crypto.subtle is not supported.");
                    }

                    crypto.subtle.digest('SHA-256', new TextEncoder().encode(idmNum))
                    .then(idmNumStr => {
                        idmNumSha256 = hexString(idmNumStr);
    					//console.log("HashedIDm: " + idmNumSha256);
                    });

            	}

        	}else {
                idmNum = '';
                idmNumSha256 = '';
        	}

	    } else {
				idmNum = '';
                idmNumSha256 = '';
	    }

    })
    .catch((err) => {
	    console.log(err);
	})
	.finally(() => {
		setTimeout(() => {
            readingFlag = false;
        }, intvalTimeShort);
	});

    return readingWaiter(1);

}



/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'PaSoRich';
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
     * extensionURL will be reset when the module is loaded from the web.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for NumberBank.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }


        if (pasoriDevice !== undefined) {
            if(pasoriDevice.opened){
                pasoriDevice.close();
                //console.log("- pasoriDevice:" + pasoriDevice);
            }
        }

        navigator.usb.getDevices().then(devices => {
            //console.log(devices);
            devices.map(selectedDevice => {
                pasoriDevice = selectedDevice;
                pasoriDevice.open()
                .then(() =>
                    pasoriDevice.selectConfiguration(1)
                )
                .then(() =>
                    pasoriDevice.claimInterface(0)
                )
                .then(() => {
                   deviceFlag = true;
                })
                .catch((error) => {
                    deviceFlag = false;
                    console.log(error);
                });        
            });
        })
        .catch((error) => {
            deviceFlag = false;
            console.log(error);
        });

        
        if(pasoriDevice == null){

            let reqdevicePromise = navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c }] });

            while(reqdevicePromise == undefined){
                sleep(intvalTimeShort);
            }

            if (reqdevicePromise !== undefined) {

                reqdevicePromise.then(selectedDevice => {
                    pasoriDevice = selectedDevice;
                    return pasoriDevice.open();
                })
                .then(() => {
                    return pasoriDevice.selectConfiguration(1);
                })
                .then(() => {
                    return pasoriDevice.claimInterface(0);
                })
                .then(() => {
                    deviceFlag = true;
                    sleep(intvalTimeShort);
                    return session(pasoriDevice);
                })
                .catch((error) => {
                    deviceFlag = false;
                    console.log(error);
                });

            }
        }

        console.log(PaSoRichVersion);

    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        this.setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIconURI,
            showStatusButton: false,
            blocks: [
                {
                    opcode: 'openPasori',
                    text: formatMessage({
                        id: 'pasorich.Connect',
                        default: 'Connect',
                        description: 'openPasori'
                    }),
                    blockType: BlockType.REPORTER
                },
                '---',
                {
                    opcode: 'readPasori',
                    text: formatMessage({
                        id: 'pasorich.readPasori',
                        default: 'read PaSoRi',
                        description: 'readPasori'
                    }),
                    blockType: BlockType.COMMAND,
                },
               '---',
               {
                    opcode: 'getIdm',
                    text: formatMessage({
                        id: 'pasorich.getIdm',
                        default: 'IDm',
                        description: 'getIdm'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'resetIdm',
                    text: formatMessage({
                        id: 'pasorich.resetIdm',
                        default: 'reset IDm',
                        description: 'reset IDm and Variables'
                    }),
                    blockType: BlockType.COMMAND,
                }
            ],
            menus: {
            },
            // eslint-disable-next-line no-use-before-define
            translationMap: extensionTranslations
        };
    }


    openPasori () {

        if (deviceFlag || (pasoriDevice !== undefined && pasoriDevice !== null)) {
            connectingCount = 0;
            isConnect = formatMessage({
                id: 'pasorich.ConnectConnected',
                default: 'Connected...',
                description: 'ConnectConnected'
            });
            return isConnect;
        }

        if(connectingCount >= 1){
            isConnect = formatMessage({
                id: 'pasorich.ConnectConnecting',
                default: 'Connecting...',
                description: 'ConnectConnecting'
            });
            return isConnect;
        }
        else {

            connectingCount += 1;

            isConnect = formatMessage({
                id: 'pasorich.ConnectConnecting',
                default: 'Connecting...',
                description: 'ConnectConnecting'
            });

            if (connectingCount > 1){
                return isConnect;
            }

            let reqdevicePromise = navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c }] });

            while(reqdevicePromise == undefined){
                sleep(intvalTimeShort);
            }

            if (reqdevicePromise !== undefined) {
               reqdevicePromise.then(selectedDevice => {
                    pasoriDevice = selectedDevice;
                    return pasoriDevice.open();
                })
                .then(() => {
                    return pasoriDevice.selectConfiguration(1);
                })
                .then(() => {
                    return pasoriDevice.claimInterface(0);
                })
                .then(() => {
                    connectingCount = 0;
                    isConnect = formatMessage({
                        id: 'pasorich.ConnectSuccess',
                        default: 'Success...',
                        description: 'ConnectSuccess'
                    });
                    deviceFlag = true;
                    return isConnect;
                })
                .catch((error) => {
                    console.log(error);
                    connectingCount = 0;
                    isConnect = formatMessage({
                        id: 'pasorich.ConnectFailure',
                        default: 'Failure...',
                        description: 'ConnectFailure'
                    });
                    pasoriDevice = null;
                    deviceFlag = false;
                    return isConnect;
                });
            }
        }

        return isConnect;

    }


    readPasori () {

        if(readingFlag){return;}
        readingFlag = true;

        if(deviceFlag){

            if(pasoriDevice.opened && pasoriDevice !== null){
                sleep(intvalTimeShort);
                return session(pasoriDevice);
            }
            else {

                let devicePromise = navigator.usb.getDevices();

                while(devicePromise == undefined){
                    sleep(intvalTimeShort);
                }

                if (devicePromise !== undefined) {
                    devicePromise.then(devices => {
                        //console.log(devices);
                        devices.map(selectedDevice => {
                            pasoriDevice = selectedDevice;
                            pasoriDevice.open().then(() => {
                                return pasoriDevice.selectConfiguration(1);
                            })
                            .then(() => {
                                return pasoriDevice.claimInterface(0);
                            })
                            .then(() => {
                                deviceFlag = true;
                                sleep(intvalTimeShort);
                                return session(pasoriDevice);
                            })
                            .catch((error) => {
                                deviceFlag = false;
                                readingFlag = false;
                                console.log(error);
                            });

                        });
                    })
                    .catch((error) => { 
                        deviceFlag = false;
                        readingFlag = false;
                        console.log(error);
                    });
                }

            }

        }
        else {
            //select

            let reqdevicePromise = navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c }] });

            while(reqdevicePromise == undefined){
                sleep(intvalTimeShort);
            }

            if (reqdevicePromise !== undefined) {

                reqdevicePromise.then(selectedDevice => {
                    pasoriDevice = selectedDevice;
                    return pasoriDevice.open();
                })
                .then(() => {
                    return pasoriDevice.selectConfiguration(1);
                })
                .then(() => {
                    return pasoriDevice.claimInterface(0);
                })
                .then(() => {
                    deviceFlag = true;
                    sleep(intvalTimeShort);
                    return session(pasoriDevice);
                })
                .catch((error) => {
                    deviceFlag = false;
                    readingFlag = false;
                    console.log(error);
                });

            }

        }
                
    }


    getIdm () {
        return idmNum;
    }

    
	resetIdm () {
        idmNum = '';
        idmNumSha256 ='';
        readingFlag = false;
        return;
    }


    /**
     * Setup format-message for this extension.
     */
    setupTranslations () {
        const localeSetup = formatMessage.setup();
        if (localeSetup && localeSetup.translations[localeSetup.locale]) {
            Object.assign(
                localeSetup.translations[localeSetup.locale],
                // eslint-disable-next-line no-use-before-define
                extensionTranslations[localeSetup.locale]
            );
        }
    }
}

const extensionTranslations = {
    'ja': {
        'pasorich.PaSoRich': 'パソリッチ',
        'pasorich.push2Connect':'押して接続',
        'pasorich.Connect': '接続',
        'pasorich.readPasori': 'パソリ読み取り',
        'pasorich.getIdm': 'IDm',
        'pasorich.getHashedIdm': 'HexIDm',
        'pasorich.resetIdm': 'IDmリセット',
        'pasorich.getReadingFlag': '読取中',
        'pasorich.getWaitingFlag': '待機中',
        'pasorich.readingDone': '読み取り完了',
        'pasorich.ConnectReading': '読取中...',
        'pasorich.push2Connect': 'クリックして接続開始',
        'pasorich.ConnectConnected': '接続完了...',
        'pasorich.ConnectConnecting': '接続中...',
        'pasorich.ConnectSuccess': '接続成功...',
        'pasorich.ConnectFailure': '接続失敗...'
    },
    'ja-Hira': {
        'pasorich.PaSoRich': 'ぱそりっち',
        'pasorich.push2Connect':'おしてせつぞく',
        'pasorich.Connect': 'せつぞく',
        'pasorich.readPasori': 'パソリよみとり',
        'pasorich.getIdm': 'IDm',
        'pasorich.getHashedIdm': 'HexIDm',
        'pasorich.resetIdm': 'IDmリセット',
        'pasorich.getReadingFlag': 'よみとりちゅう',
        'pasorich.getWaitingFlag': 'たいきちゅう',
        'pasorich.readingDone': 'よみとりかんりょう',
        'pasorich.ConnectReading': 'よみとりちゅう...',
        'pasorich.push2Connect': 'クリックしてせつぞくかいし',
        'pasorich.ConnectConnected': 'せつぞくかんりょう...',
        'pasorich.ConnectConnecting': 'せつぞくちゅう...',
        'pasorich.ConnectSuccess': 'せつぞくせいこう...',
        'pasorich.ConnectFailure': 'せつぞくしっぱい...'
    }
};

module.exports = ExtensionBlocks;
