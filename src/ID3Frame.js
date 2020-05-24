const ID3Util = require("./ID3Util");
const ID3FrameReader = require("./ID3FrameReader");

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

class ID3Frame {
    constructor(id3Tag, frame = {}, identifier, specification) {
        this.id3Tag = id3Tag;
        this.identifier = identifier;
        this.frame = frame;
        this.specification = specification
    }

    loadFrom(buffer) {
        if(!buffer || buffer.length < 10 || !this.id3Tag) {
            return null;
        }

        let identifierSize;
        switch(this.id3Tag.version) {
            case 0x02:
                identifierSize = ID3V2_2_IDENTIFIER_SIZE;
                break;
            case 0x03:
                identifierSize = ID3V2_3_IDENTIFIER_SIZE;
                break;
            case 0x04:
                identifierSize = ID3V2_4_IDENTIFIER_SIZE;
                break;
            default:
                return null;
        }

        this.identifier = buffer.slice(0, identifierSize).toString();
        this.header = buffer.slice(0, 10);
        this.frame = { value: {} };
        if(buffer.length > 10) {
            this.body = buffer.slice(10, buffer.readUInt32BE(identifierSize) + 10);
            if(this.specification) {
                let frame = ID3FrameReader.buildFrame(this.body, this.specification);
                this.frame = frame || this.frame;
            }
        } else {
            this.body = Buffer.alloc(0);
        }

        return this;
    }

    createBuffer() {
        if(!this.identifier) {
            return null;
        }
        if(this.specification) {
            this.body = ID3FrameReader.buildBuffer(this.frame, this.specification);
        }
        let header = Buffer.alloc(10, 0x00);
        header.write(this.identifier, 0);
        header.writeUInt32BE(this.body.length, this.identifier.length);
        return Buffer.concat([header, this.body]);
    };
}

module.exports = ID3Frame;

module.exports.TextInformationFrame = class TextInformationFrame extends ID3Frame {
    constructor(id3Tag, value = "", identifier = "TTTT", encodingByte = 0x01) {
        const specification = [
            {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
        ];
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.UserDefinedTextFrame = class UserDefinedTextFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "TXXX", encodingByte = 0x01) {
        const specification = [
            {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
            {name: "value.value", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
        ];
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.AttachedPictureFrame = class AttachedPictureFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "APIC", encodingByte = 0x01) {
        const specification = [
            {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.mime", func: ID3FrameReader.nullTerminated, dataType: "string"},
            {name: "value.type.id", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
            {name: "value.imageBuffer", func: ID3FrameReader.staticSize}
        ];
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, specification);
    }

    loadFrom(buffer) {
        super.loadFrom(buffer);
        if(this.frame.value.type && this.frame.value.type.id) {
            this.frame.value.type.name = ID3Util.pictureTypeByteToName(this.frame.value.type.id);
        }
        if(this.frame.value.mime) {
            this.frame.value.mime = ID3Util.pictureMimeParser(this.frame.value.mime);
        }

        return this;
    }

    createBuffer() {
        let mimeType = this.frame.value.mime;
        this.frame.value.mime = ID3Util.pictureMimeWriter(this.frame.value.mime);
        let buffer = super.createBuffer();
        this.frame.value.mime = mimeType;
        return buffer;
    }
};

module.exports.UnsynchronisedLyricsFrame = class UnsynchronisedLyricsFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "USLT", encodingByte = 0x01) {
        const specification = [
            {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.language", func: ID3FrameReader.staticSize, args: [3], dataType: "string"},
            {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
            {name: "value.text", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
        ];
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.CommentFrame = class CommentFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "COMM", encodingByte = 0x01) {
        const specification = [
            {name: "encodingByte", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.language", func: ID3FrameReader.staticSize, args: [3], dataType: "string"},
            {name: "value.description", func: ID3FrameReader.nullTerminated, dataType: "string", encoding: "encodingByte"},
            {name: "value.text", func: ID3FrameReader.staticSize, dataType: "string", encoding: "encodingByte"}
        ];
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.PopularimeterFrame = class PopularimeterFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "POPM") {
        const specification = [
            {name: "value.email", func: ID3FrameReader.nullTerminated, dataType: "string"},
            {name: "value.rating", func: ID3FrameReader.staticSize, args: [1], dataType: "number"},
            {name: "value.counter", func: ID3FrameReader.staticSize, args: [4], dataType: "number"}
        ];
        const frame = { value };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.PrivateFrame = class PrivateFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "PRIV") {
        const specification = [
            {name: "value.ownerIdentifier", func: ID3FrameReader.nullTerminated, dataType: "string"},
            {name: "value.data", func: ID3FrameReader.staticSize, encoding: 0x01}
        ];
        const frame = { value };
        super(id3Tag, frame, identifier, specification);
    }
};

module.exports.ChapterFrame = class ChapterFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "CHAP") {
        const specification = [
            {name: "value.elementID", func: ID3FrameReader.nullTerminated, dataType: "string"},
            {name: "value.startTimeMs", func: ID3FrameReader.staticSize, args: [4], dataType: "number"},
            {name: "value.endTimeMs", func: ID3FrameReader.staticSize, args: [4], dataType: "number"},
            {name: "value.startOffsetBytes", func: ID3FrameReader.staticSize, args: [4], dataType: "number", optional: true},
            {name: "value.endOffsetBytes", func: ID3FrameReader.staticSize, args: [4], dataType: "number", optional: true},
            {name: "value.tags", func: ID3FrameReader.subframes, args: [id3Tag], optional: true}
        ];
        const frame = { value };
        super(id3Tag, frame, identifier, specification);
    }
};
