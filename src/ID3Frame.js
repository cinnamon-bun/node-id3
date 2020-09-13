const ID3Util = require("./ID3Util");
const ID3FrameReader = require("./ID3FrameReader");
const ID3FrameSpecifications = require("./ID3FrameSpecifications");

const ID3V2_2_IDENTIFIER_SIZE = 3;
const ID3V2_3_IDENTIFIER_SIZE = 4;
const ID3V2_4_IDENTIFIER_SIZE = 4;

const ID3V2_2_HEADER_SIZE = 6;
const ID3V2_3_HEADER_SIZE = 10;
const ID3V2_4_HEADER_SIZE = 10;

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
        let headerSize;
        switch(this.id3Tag.version) {
            case 0x02:
                identifierSize = ID3V2_2_IDENTIFIER_SIZE;
                headerSize = ID3V2_2_HEADER_SIZE;
                break;
            case 0x03:
                identifierSize = ID3V2_3_IDENTIFIER_SIZE;
                headerSize = ID3V2_3_HEADER_SIZE;
                break;
            case 0x04:
                identifierSize = ID3V2_4_IDENTIFIER_SIZE;
                headerSize = ID3V2_4_HEADER_SIZE;
                break;
            default:
                return null;
        }

        this.identifier = buffer.slice(0, identifierSize).toString();
        this.header = buffer.slice(0, headerSize);
        this.frame = { value: {} };
        if(buffer.length > headerSize) {
            this.body = buffer.slice(headerSize, buffer.readUInt32BE(identifierSize) + headerSize);
            if(this.specification) {
                let frame = ID3FrameReader.buildFrame(this.body, this.specification, this.id3Tag);
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
            this.body = ID3FrameReader.buildBuffer(this.frame, this.specification, this.id3Tag);
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
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).TextInformationFrame);
    }
};

module.exports.UserDefinedTextFrame = class UserDefinedTextFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "TXXX", encodingByte = 0x01) {
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).UserDefinedTextFrame);
    }
};

module.exports.AttachedPictureFrame = class AttachedPictureFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "APIC", encodingByte = 0x01) {
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).AttachedPictureFrame);
    }

    loadFrom(buffer) {
        super.loadFrom(buffer);
        if(this.frame.value.type && this.frame.value.type.id !== undefined) {
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
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).UnsynchronisedLyricsFrame);
    }
};

module.exports.CommentFrame = class CommentFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "COMM", encodingByte = 0x01) {
        const frame = {
            encodingByte,
            value
        };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).CommentFrame);
    }
};

module.exports.PopularimeterFrame = class PopularimeterFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "POPM") {
        const frame = { value };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).PopularimeterFrame);
    }
};

module.exports.PrivateFrame = class PrivateFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "PRIV") {
        const frame = { value };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).PrivateFrame);
    }
};

module.exports.ChapterFrame = class ChapterFrame extends ID3Frame {
    constructor(id3Tag, value = {}, identifier = "CHAP") {
        const frame = { value };
        super(id3Tag, frame, identifier, ID3FrameSpecifications.getByVersion(id3Tag.version).ChapterFrame);
    }
};
