/**
 * crops the text to a certain width and adds "..." in the end
 * @param {string} text
 * @param {number} fontSize
 * @param {*} fontweight
 * @param {number} maxWidth
 * @returns {string}
 */
export function cropText(text, fontSize, fontweight, maxWidth) {
    let returnText = text;
    const context = document.createElement('canvas').getContext('2d');
    context.font = `${fontweight} ${fontSize}px sans-serif`;
    const width = context.measureText(text).width;
    if (width > maxWidth) {
        for (let i = 1; i < text.length; i += 1) {
            const prevText = text.substr(0, i - 1).concat('...');
            const currText = text.substr(0, i).concat('...');
            const prevWidth = context.measureText(prevText).width;
            const currWidth = context.measureText(currText).width;
            if (currWidth > maxWidth && prevWidth < maxWidth) {
                returnText = prevText;
                break;
            }
        }
    }
    return returnText;
}

/**
 * crops the text to a certain width and adds "..." in the end
 * @param {string} text
 * @param {number} fontSize
 * @param {*} fontweight
 * @returns {string}
 */
export function getTextWidth(text, fontSize, fontweight) {
    const context = document.createElement('canvas').getContext('2d');
    context.font = `${fontweight} ${fontSize}px sans-serif`;
    return context.measureText(text).width;
}
export function increase_brightness(hex, percent){
    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(hex.length === 3){
        hex = hex.replace(/(.)/g, '$1$1');
    }

    var r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}
