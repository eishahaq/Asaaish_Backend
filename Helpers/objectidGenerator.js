const crypto = require('crypto');

class ObjectIdGenerator {
    /**
     * Convert a string to a 24-character hexadecimal string
     * @param {string} str - The input string
     * @returns {string} - The 24-character hexadecimal string
     */
    static encode(str) {

        const buffer = Buffer.from(str, 'utf8');
        
        let hex = buffer.toString('hex');
    
        if (hex.length > 24) {
            hex = hex.substring(0, 24);
        } else {
            hex = hex.padEnd(24, '0');
        }

        console.log(hex);
        return hex;
    }

    /**
     * Convert a 24-character hexadecimal string back to the original string
     * @param {string} hex - The 24-character hexadecimal string
     * @returns {string} - The original string
     */
    static decode(hex) {
        if (hex.length !== 24) {
            throw new Error('Hex string must be exactly 24 characters');
        }

        hex = hex.replace(/0+$/, '');

        const buffer = Buffer.from(hex, 'hex');
        console.log(buffer.toString('utf8'));
        return buffer.toString('utf8');
    }
}

module.exports = ObjectIdGenerator;
