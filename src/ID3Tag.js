module.exports = ID3Tag;

const ID3Frame = require('./ID3Frame');
const ID3Util = require('./ID3Util');
const ID3FrameMapper = require('./ID3FrameMapper');

function ID3Tag(frames = {}, version = 3, flags = {}) {
    this.frames = frames;
    this.version = version;
    this.flags = flags;
}

/**
 * @return {Buffer, null}
 */
ID3Tag.prototype.createBuffer = function() {
    let header = Buffer.alloc(10);
    header.writeUIntBE(0x494433, 0, 3);
    header.writeUInt8(this.version, 3);
    let flagsByte = 0;
    if(this.flags) {
        if(this.flags.unsynchronisation) {
            flagsByte += 128;
        }
        if(this.flags.extendedHeader) {
            flagsByte += 64;
        }
        if(this.flags.experimentalIndicator) {
            flagsByte += 32;
        }
        if(this.flags.footerPresent) {
            flagsByte += 16;
        }
    }
    header.writeUInt8(flagsByte, 5);

    let body = this.framesToBuffer(this.frames);

    header.writeUInt32BE(ID3Util.encodeSize(body.length).readUInt32BE(0), 6);
    return Buffer.concat([header, body]);
};

/**
 *
 * @return {Buffer}
 */
ID3Tag.prototype.framesToBuffer = function(frames = {}) {
    let frameBuffers = [];

    this.framesToFlatArray(frames).forEach(function(frame) {
        let frameIdentifier = ID3FrameMapper.getFrameIdentifier(frame[0]);
        let frameType = ID3FrameMapper.getFrameType(frameIdentifier);
        if(!frameType) return;
        let buffer = (new frameType(this, frame[1], frameIdentifier)).createBuffer();
        frameBuffers.push(buffer);
    }.bind(this));

    return Buffer.concat(frameBuffers);
};

ID3Tag.prototype.framesToFlatArray = function(frames = {}) {
    return Object.entries(frames).filter(function(frame) {
        if(frame[1] instanceof Array) {
            return (frame[1].length > 0 && ID3FrameMapper.getFrameOptions(frame[0]).multiple);
        } else {
            return true;
        }
    }).reduce(function(result, frame) {
        if(frame[1] instanceof Array) {
            frame[1].forEach(function(subFrame) {
                result.push([frame[0], subFrame]);
            });
        } else {
            result.push(frame);
        }
        return result;
    }, []);
};

/**
 *
 * @return {this, null}
 */
ID3Tag.prototype.loadFrom = function(buffer) {
    const framePosition = ID3Util.getFramePosition(buffer);

    if(framePosition === -1) {
        return null;
    } else {
        this.header = buffer.slice(framePosition, framePosition + 10);
        this.version = buffer[framePosition + 3];
        let flagByte = buffer[framePosition + 5];
        // Flag bits from 0 - 7
        this.flags = {
            // Bit 7
            unsynchronisation: flagByte & 128,
            // Bit 6
            extendedHeader: flagByte & 64,
            // Bit 5
            experimentalIndicator: flagByte & 32,
            // Bit 4
            footerPresent: flagByte & 16
        };
        this.size = ID3Util.decodeSize(buffer.slice(framePosition + 6, framePosition + 10));
        if(buffer.length > 10) {
            this.body = buffer.slice(framePosition + 10, framePosition + 10 + this.size);
        }
        return this;
    }
};

ID3Tag.prototype.getTags = function() {
    return this.getTagsFromBuffer(this.body || Buffer.alloc(0));
};

ID3Tag.prototype.getTagsFromBuffer = function(body) {
    let tags = { raw: {} };
    let frames = this.getTagFramesFromBuffer(body);
    frames.forEach(function(frame) {
        let frameName = ID3FrameMapper.getFrameName(frame.identifier);
        if(ID3FrameMapper.getFrameOptions(frame.identifier).multiple) {
            if(!tags[frameName]) tags[frameName] = [];
            if(!tags["raw"][frame.identifier])tags["raw"][frame.identifier] = [];
            tags[frameName].push(frame.frame.value);
            tags["raw"][frame.identifier].push(frame.frame.value);
        } else {
            tags[frameName] = tags["raw"][frame.identifier] = frame.frame.value;
        }
    });
    return tags;
};

/**
 *
 * @return {[ID3Frame]}
 */
ID3Tag.prototype.getTagFramesFromBuffer = function(buffer) {
    let frames = [];
    if(!buffer) {
        return frames;
    }

    let currentPosition = 0;
    while(currentPosition < buffer.length && buffer[currentPosition] !== 0x00) {
        let currentFrame = (new ID3Frame(this)).loadFrom(buffer.slice(currentPosition));
        if(currentFrame && currentFrame.body && currentFrame.body.length > 0) {
            let frameType = ID3FrameMapper.getFrameType(currentFrame.identifier);
            if(!frameType) {
                currentPosition += currentFrame.body.length + currentFrame.header.length;
                continue;
            }
            let frame = new frameType(this, null, currentFrame.identifier).loadFrom(buffer.slice(currentPosition));
            if(!frame) {
                currentPosition += currentFrame.body.length + currentFrame.header.length;
                continue;
            }
            frames.push(frame);
            currentPosition += currentFrame.body.length + currentFrame.header.length;
        } else {
            currentPosition++;
        }
    }
    return frames;
};
