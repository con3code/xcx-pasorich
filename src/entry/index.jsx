/**
 * This is an extension for Xcratch.
 */

import iconURL from './pasorich_entry.png';
import insetIconURL from './pasorich_inset.png';

/**
 * Formatter to translate the messages in this extension.
 * This will be replaced which is used in the React component.
 * @param {object} messageData - data for format-message
 * @returns {string} - translated message for the current locale
 */
let formatMessage = messageData => messageData.defaultMessage;

const translationMap = {
    'ja': {
        'gui.extension.pasorich.description': 'ICカードの番号を読み取り'
    },
    'ja-Hira': {
        'gui.extension.pasorich.description': 'ICカードのばんごうをよみとり'
    }
};

const entry = {
    name: 'PaSoRich',
    extensionId: 'pasorich',
    extensionURL: 'https://con3office.github.io/xcx-pasorich/dist/pasorich.mjs',
    collaborator: 'con3office',
    iconURL: iconURL,
    insetIconURL: insetIconURL,
    get description () {
        return formatMessage({
            defaultMessage: "Read SmartCard's IDm.",
            description: "Description for the 'PaSoRich' extension",
            id: 'gui.extension.pasorich.description'
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
    translationMap: translationMap
};

export {entry}; // loadable-extension needs this line.
export default entry;
