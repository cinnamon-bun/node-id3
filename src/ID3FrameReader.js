module.exports = new ID3FrameReader;

const ID3Util = require("./ID3Util");
const ID3Tag = require("./ID3Tag");

function ID3FrameReader() {
}

ID3FrameReader.prototype.buildFrame = function(buffer, array) {
    let frame = {};
    let result = [null, buffer.slice(0)];
    for(let spec of array) {
        if(!result[1] || result[1].length === 0) {
            if(spec.optional) {
                continue;
            } else {
                break;
            }
        }
        result = spec.func.fromBuffer(result[1], spec.args || [], frame, frame[spec.encoding]);
        if(spec.dataType) {
            setNestedKey(frame, spec.name, convertDataType.fromBuffer(result[0], spec.dataType, frame, frame[spec.encoding]));
        } else {
            setNestedKey(frame, spec.name, result[0]);
        }
    }

    return frame;
};

ID3FrameReader.prototype.buildBuffer = function(frame, array) {
    let buffers = [];
    for(let spec of array) {
        let convertedValue = getNestedKey(frame, spec.name);
        if(spec.dataType) {
            convertedValue = convertDataType.toBuffer(getNestedKey(frame, spec.name), spec.dataType, null, frame[spec.encoding]);
        }
        let buffer = spec.func.toBuffer(convertedValue, spec.args, frame, frame[spec.encoding]);
        if(buffer instanceof Buffer) {
            buffers.push(buffer);
        }
    }

    return Buffer.concat(buffers);
};

const convertDataType = {
    fromBuffer: (buffer, dataType, frame, encoding = 0x00) => {
        if(!buffer) return undefined;
        if(!(buffer instanceof Buffer)) return buffer;
        if(buffer.length === 0) return undefined;
        if(dataType === "number") {
            return parseInt(buffer.toString('hex'), 16);
        } else if (dataType === "string") {
            return ID3Util.bufferToDecodedString(buffer, encoding);
        } else {
            return buffer;
        }
    },
    toBuffer: (value, dataType, buffer, encoding = 0x00) => {
        if (value instanceof Buffer) {
            return value;
        } else if(Number.isInteger(value)) {
            let hexValue = value.toString(16);
            if(hexValue.length % 2 !== 0) {
                hexValue = "0" + hexValue;
            }
            return Buffer.from(hexValue, 'hex');
        } else if (typeof value === 'string' || value instanceof String) {
            return ID3Util.stringToEncodedBuffer(value, encoding);
        } else {
            return Buffer.alloc(0);
        }
    }
};

function setNestedKey(obj, key, value) {
    key.split(".").reduce((a, b, index, keyPath) => {
        if (typeof a[b] === "undefined" && index !== keyPath.length - 1){
            a[b] = {};
            return a[b];
        }

        if (index === keyPath.length - 1){
            a[b] = value;
            return value;
        } else {
            return a[b];
        }
    }, obj);
}

function getNestedKey(obj, key = "") {
    return key.split(".").reduce((p,c)=>p&&p[c]||undefined, obj)
}

ID3FrameReader.prototype.staticSize = {
    fromBuffer: (buffer, args) => {
        let size = buffer.length;
        if(args && args.length > 0) {
            size = args[0];
        }
        if(buffer.length > size) {
            return [buffer.slice(0, size), buffer.slice(size)];
        } else {
            return [buffer.slice(0), null];
        }
    },
    toBuffer: (buffer, args) => {
        if(!(buffer instanceof Buffer)) return Buffer.alloc(0);
        if(args && args.length > 0 && buffer.length < args[0]) {
            return Buffer.concat([Buffer.alloc(args[0] - buffer.length, 0x00), buffer]);
        } else {
            return buffer;
        }
    }
};

ID3FrameReader.prototype.nullTerminated = {
    fromBuffer: (buffer, args, frame, encoding) => {
        return ID3Util.splitNullTerminatedBuffer(buffer, encoding || 0x00);
    },
    toBuffer: (buffer, args, frame, encoding) => {
        return Buffer.concat([buffer, ID3Util.terminationBuffer(encoding)]);
    }
};

ID3FrameReader.prototype.subframes = {
    fromBuffer: (buffer, args) => {
        if(!args || !(args[0] instanceof ID3Tag)) return null;
        return [args[0].getTagsFromBuffer(buffer), null];
    },
    toBuffer: (frames, args) => {
        if(!args || !(args[0] instanceof ID3Tag)) Buffer.alloc(0);
        return args[0].framesToBuffer(frames);
    }
};
