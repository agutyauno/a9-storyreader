/**
 * Converts a File object to a Base64 string.
 * @param {File} file 
 * @returns {Promise<string>}
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Strips the data URI prefix from a base64 string.
 * @param {string} b64 
 * @returns {string}
 */
export const stripDataUri = (b64) => {
    return b64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
};
