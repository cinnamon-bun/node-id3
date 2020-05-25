module.exports = new ID3FrameReader;

const ID3Util = require("./ID3Util");
const ID3Tag = require("./ID3Tag");
const ID3FrameSpecifications = require("./ID3FrameSpecifications");

function ID3FrameReader() {
}

ID3FrameReader.prototype.buildFrame = function(buffer, specification, id3Tag) {
    let frame = {};
    let splitBuffer = new ID3Util.SplitBuffer(null, buffer.slice(0));
    for(let spec of specification) {
        if(!splitBuffer.remainder || splitBuffer.remainder.length === 0) {
            if(spec.optional) {
                continue;
            } else {
                break;
            }
        }
        splitBuffer = this[spec.type].fromBuffer(splitBuffer.remainder, spec.options || {}, frame[spec.encoding], id3Tag);
        let nestedName = getNestedNameByVisibility(spec.name, spec.visibility);
        console.log("name: " + nestedName);
        if(spec.dataType) {
            setNestedKey(frame, nestedName, convertDataType.fromBuffer(splitBuffer.value, spec.dataType, frame[spec.encoding], id3Tag));
        } else {
            setNestedKey(frame, nestedName, splitBuffer.value);
        }
    }

    return frame;
};

ID3FrameReader.prototype.buildBuffer = function(frame, specification, id3Tag) {
    let buffers = [];
    for(let spec of specification) {
        let nestedName = getNestedNameByVisibility(spec.name, spec.visibility);
        let convertedValue = getNestedKey(frame, nestedName);
        if(spec.dataType) {
            convertedValue = convertDataType.toBuffer(getNestedKey(frame, nestedName), spec.dataType, frame[spec.encoding], id3Tag);
        }
        let buffer = this[spec.type].toBuffer(convertedValue, spec.options || {}, frame[spec.encoding], id3Tag);
        if(buffer instanceof Buffer) {
            buffers.push(buffer);
        }
    }

    return Buffer.concat(buffers);
};

const convertDataType = {
    fromBuffer: (buffer, dataType, encoding = 0x00) => {
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
    toBuffer: (value, dataType, encoding = 0x00) => {
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

function getNestedNameByVisibility(name, visibility) {
    let nestedName = visibility === ID3FrameSpecifications.Visibilities.INTERNAL ? name : `value.${name}`;
    if(nestedName[nestedName.length - 1] === '.') {
        nestedName = nestedName.substring(0, nestedName.length - 1);
    }
    return nestedName;
}

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

ID3FrameReader.prototype.staticData = {
    fromBuffer: (buffer, options) => {
        let size = buffer.length;
        if(options.size) {
            size = options.size;
        }
        if(buffer.length > size) {
            return new ID3Util.SplitBuffer(buffer.slice(0, size), buffer.slice(size));
        } else {
            return new ID3Util.SplitBuffer(buffer.slice(0), null);
        }
    },
    toBuffer: (buffer, options) => {
        if(!(buffer instanceof Buffer)) return Buffer.alloc(0);
        if(options.size && buffer.length < options.size) {
            return Buffer.concat([Buffer.alloc(options.size - buffer.length, 0x00), buffer]);
        } else {
            return buffer;
        }
    }
};

ID3FrameReader.prototype.nullTerminated = {
    fromBuffer: (buffer, options, encoding = 0x00) => {
        return ID3Util.splitNullTerminatedBuffer(buffer, encoding);
    },
    toBuffer: (buffer, options, encoding = 0x00) => {
        return Buffer.concat([buffer, ID3Util.terminationBuffer(encoding)]);
    }
};

ID3FrameReader.prototype.subframes = {
    fromBuffer: (buffer, options, encoding, id3Tag) => {
        if(!(id3Tag instanceof ID3Tag)) return null;
        return new ID3Util.SplitBuffer(id3Tag.getTagsFromBuffer(buffer), null);
    },
    toBuffer: (frames, options, encoding, id3Tag) => {
        if(!(id3Tag instanceof ID3Tag)) Buffer.alloc(0);
        return id3Tag.framesToBuffer(frames);
    }
};
