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

    
    static decode(hex) {
        if (!hex) {
            console.error('Decode function received a null or undefined hex string.');
            throw new Error('Hex string is undefined or null.');
        }
        if (hex.length !== 24) {
            console.error(`Invalid hex string length: ${hex.length} for hex: ${hex}`);
            throw new Error('Hex string must be exactly 24 characters');
        }

        const buffer = Buffer.from(hex, 'hex');
        const decodedString = buffer.toString('utf8');
        console.log(`Decoded string: ${decodedString}`);
        return decodedString;
    }
}

module.exports = ObjectIdGenerator;
