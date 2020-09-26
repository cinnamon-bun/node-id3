module.exports = {};

const iconv = require('iconv-lite');

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
];

const APIC_TYPES = [
    "other",
    "file icon",
    "other file icon",
    "front cover",
    "back cover",
    "leaflet page",
    "media",
    "lead artist",
    "artist",
    "conductor",
    "band",
    "composer",
    "lyricist",
    "recording location",
    "during recording",
    "during performance",
    "video screen capture",
    "a bright coloured fish",
    "illustration",
    "band logotype",
    "publisher logotype"
];

module.exports.encodingByteToString = function(byte) {
    if(byte > -1 && byte < ENCODINGS.length) {
        return ENCODINGS[byte];
    } else {
        return ENCODINGS[0];
    }
};

module.exports.encodingByteFromString = function(encoding) {
    if(ENCODINGS.indexOf(encoding) !== -1) {
        return ENCODINGS.indexOf(encoding);
    } else {
        return 0x00;
    }
};

module.exports.encodingFromStringOrByte = function(encoding) {
    if(ENCODINGS.indexOf(encoding) !== -1) {
        return encoding;
    } else if(encoding > -1 && encoding < ENCODINGS.length) {
        encoding = ENCODINGS[encoding];
    } else {
        encoding = ENCODINGS[0];
    }
    return encoding;
};

/**
 * @return {Buffer}
 */
module.exports.encodeSize = function(totalSize) {
    let byte_3 = totalSize & 0x7F;
    let byte_2 = (totalSize >> 7) & 0x7F;
    let byte_1 = (totalSize >> 14) & 0x7F;
    let byte_0 = (totalSize >> 21) & 0x7F;
    return Buffer.from([byte_0, byte_1, byte_2, byte_3]);
};

/**
 * @return {Buffer}
 */
module.exports.decodeSize = function(hSize) {
    return (hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + hSize[3];
};

module.exports.sizeToBuffer = function(totalSize) {
    let buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(totalSize);
    return buffer;
};

/**
 * @return {boolean}
 */
module.exports.isValidID3Header = function(buffer) {
    if(buffer.length < 10) {
        return false;
    } else if(buffer.readUIntBE(0, 3) !== 0x494433) {
        return false;
    } else if([0x02, 0x03, 0x04].indexOf(buffer[3]) === -1 || buffer[4] !== 0x00) {
        return false;
    } else if(buffer[6] & 128 === 1 || buffer[7] & 128 === 1 || buffer[8] & 128 === 1 || buffer[9] & 128 === 1) {
        return false;
    }
    return true;
};

module.exports.stringToEncodedBuffer = function(str, encodingByte) {
    return iconv.encode(str, this.encodingFromStringOrByte(encodingByte));
};

module.exports.bufferToDecodedString = function(buffer, encodingByte) {
    return iconv.decode(buffer, this.encodingFromStringOrByte(encodingByte)).replace(/\0/g, '');
};

module.exports.stringToTerminatedBuffer = function(unterminatedString, encodingByte) {
    return this.stringToEncodedBuffer(unterminatedString + "\0", encodingByte);
};

module.exports.terminationBuffer = function(encodingByte = 0x00) {
    if(encodingByte === 0x01 || encodingByte === 0x02) {
        return Buffer.alloc(2, 0x00);
    } else {
        return Buffer.alloc(1, 0x00);
    }
};

module.exports.SplitBuffer = class SplitBuffer {
    constructor(value = null, remainder = null) {
        this.value = value;
        this.remainder = remainder;
    }
};

module.exports.splitNullTerminatedBuffer = function(buffer, encodingByte = 0x00) {
    let termination = { start: -1, size: 0 };
    if(encodingByte === 0x01 || encodingByte === 0x02) {
        termination.start = buffer.indexOf(Buffer.from([0x00, 0x00]));
        termination.size = 2;
        if(termination.start !== -1 && buffer.length > (termination.start + termination.size)) {
            if(buffer[termination.start + termination.size] === 0x00) {
                termination.start += 1;
            }
        }
    } else {
        termination.start = buffer.indexOf(0x00);
        termination.size = 1;
    }

    if(termination.start === -1) {
        return new this.SplitBuffer(null, buffer.slice(0));
    }
    else if(buffer.length <= termination.start + termination.length) {
        return new this.SplitBuffer(buffer.slice(0, termination.start), null);
    } else {
        return new this.SplitBuffer(buffer.slice(0, termination.start), buffer.slice(termination.start + termination.size));
    }
};

module.exports.pictureMimeParser = function(mime) {
    switch(mime) {
        case "image/jpeg":
            return "jpeg";
        case "image/png":
            return "png";
        default:
            return mime;
    }
};

module.exports.pictureMimeWriter = function(mime) {
    switch(mime) {
        case "jpeg":
            return "image/jpeg";
        case "png":
            return "image/png";
        default:
            return mime;
    }
};

module.exports.pictureTypeByteToName = function(byte) {
    if(byte < 0 || byte >= APIC_TYPES.length) {
        return APIC_TYPES[0];
    } else {
        return APIC_TYPES[byte];
    }
};

module.exports.pictureTypeNameToByte = function(name) {
    return APIC_TYPES.indexOf(name) !== -1 ? APIC_TYPES[APIC_TYPES.indexOf(name)] : 0x00;
};

module.exports.getFramePosition = function(buffer) {
    /* Search Buffer for valid ID3 frame */
    let framePosition = -1;
    let frameHeaderValid = false;
    do {
        framePosition = buffer.indexOf("ID3", framePosition + 1);
        if(framePosition !== -1) {
            /* It's possible that there is a "ID3" sequence without being an ID3 Frame,
             * so we need to check for validity of the next 10 bytes
             */
            frameHeaderValid = this.isValidID3Header(buffer.slice(framePosition, framePosition + 10));
        }
    } while (framePosition !== -1 && !frameHeaderValid);

    if(!frameHeaderValid) {
        return -1;
    } else {
        return framePosition;
    }
}

module.exports.removeTagFromBuffer = function(buffer) {
    const framePosition = this.getFramePosition(buffer);
    if(framePosition === -1) {
        return buffer;
    }
    if(buffer.length >= framePosition + 10 && this.isValidID3Header(buffer.slice(framePosition, framePosition + 10))) {
        const size = this.decodeSize(buffer.slice(framePosition + 6, framePosition + 10));
        return Buffer.concat([buffer.slice(0, framePosition), buffer.slice(framePosition + size + 10)])
    } else {
        return buffer;
    }
}
