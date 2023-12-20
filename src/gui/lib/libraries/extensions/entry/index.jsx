/**
 * This is an extension for Xcratch.
 */

import iconURL from './pasorich_entry.png';
import insetIconURL from './pasorich_inset.png';
import translations from './translations.json';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const entry = {
    get name () {
        return formatMessage({
            id: 'pasorich.entry.name',
            default: 'PaSoRich',
            description: 'Name of the extension'
        });
    },
    extensionId: 'pasorich',
    extensionURL: 'https://con3code.github.io/xcx-pasorich/dist/pasorich.mjs',
    collaborator: 'con3code',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            defaultMessage: 'Read SmartCard IDm.',
            description: 'Description for this extension',
            id: 'pasorich.entry.description'
        });
    },
    featured: true,
    disabled: false,
    bluetoothRequired: false,
    internetConnectionRequired: false,
    helpLink: 'https://con3.com/sc2scratch/',
    setFormatMessage: formatter => {
        formatMessage = formatter;
    },
    translationMap: translations
};

export {entry}; // loadable-extension needs this line.
export default entry;
