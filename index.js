const fs = require('fs')
const iconv = require("iconv-lite")
const ID3Tag = require('./src/ID3Tag')
const ID3Util = require('./src/ID3Util')

module.exports = new NodeID3

/*
**  Used specification: http://id3.org/id3v2.3.0
*/

/* TODO */
const SFrames = {
    userDefinedUrl: {
        create: "createUserDefinedUrl",
        read: "readUserDefinedUrl",
        name: "WXXX",
        multiple: true,
        updateCompareKey: "description"
    }
}

/* TODO */
const WFrames = {
    commercialUrl: {
        name: "WCOM",
        multiple: true
    },
    copyrightUrl: {
        name: "WCOP"
    },
    fileUrl: {
        name: "WOAF"
    },
    artistUrl: {
        name: "WOAR",
        multiple: true
    },
    audioSourceUrl: {
        name: "WOAS"
    },
    radioStationUrl: {
        name: "WORS"
    },
    paymentUrl: {
        name: "WPAY"
    },
    publisherUrl: {
        name: "WPUB"
    }
}

/* TODO */
const WFramesV220 = {
    commercialUrl: {
        name: "WCM",
        multiple: true
    },
    copyrightUrl: {
        name: "WCP"
    },
    fileUrl: {
        name: "WAF"
    },
    artistUrl: {
        name: "WAR",
        multiple: true
    },
    audioSourceUrl: {
        name: "WAS"
    },
    publisherUrl: {
        name: "WPB"
    },
    userDefinedUrl: {
        name: "WXX",
        multiple: true,
        hasDescription: true
    }
}

function NodeID3() {
}

NodeID3.prototype.create = function(tags, fn) {
    const id3Buffer = new ID3Tag(tags).createBuffer();
    if(fn && typeof fn === 'function') {
        fn(id3Buffer);
    } else {
        return id3Buffer;
    }
}

NodeID3.prototype.write = function(tags, filebuffer, fn) {
    const id3Buffer = new ID3Tag(tags).createBuffer();
    if(filebuffer instanceof Buffer) {
        const filebufferExistingId3 = new ID3Tag().loadFrom(filebuffer)
        if(filebufferExistingId3 && filebufferExistingId3.header) {
            filebuffer = ID3Util.removeTagFromBuffer(filebuffer) || filebuffer
        }
        const bufferWithId3Tag = Buffer.concat([id3Buffer, filebuffer]);
        if(fn && typeof fn === 'function') {
            fn(null, bufferWithId3Tag)
        } else {
            return bufferWithId3Tag
        }
    } else {
        if(fn && typeof fn === 'function') {
            try {
                fs.readFile(filebuffer, function(err, data) {
                    if(err) {
                        fn(err);
                        return;
                    }
                    let strippedBuffer = ID3Util.removeTagFromBuffer(data) || data;
                    let completeBuffer = Buffer.concat([id3Buffer, strippedBuffer]);
                    fs.writeFile(filebuffer, completeBuffer, 'binary', function(err) {
                        fn(err);
                    });
                }.bind(this));
            } catch(err) {
                fn(err);
            }
        } else {
            try {
                let data = fs.readFileSync(filebuffer);
                let strippedBuffer = ID3Util.removeTagFromBuffer(data) || data;
                let completeBuffer = Buffer.concat([id3Buffer, strippedBuffer]);
                fs.writeFileSync(filebuffer, completeBuffer, 'binary');
                return true;
            } catch(err) {
                throw err;
            }
        }
    }
}

NodeID3.prototype.read = function(filebuffer, options, fn) {
    let tag = new ID3Tag();
    if(!fn || typeof fn !== 'function') {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            filebuffer = fs.readFileSync(filebuffer)
        }
        tag.loadFrom(filebuffer);
        return tag.getTags();
    } else {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            fs.readFile(filebuffer, function(err, data) {
                if(err) {
                    fn(err, null);
                } else {
                    tag.loadFrom(data);
                    fn(null, tag.getTags());
                }
            }.bind(this))
        } else {
            tag.loadFrom(filebuffer);
            fn(null, tag.getTags());
        }
    }
}

/*
**  Update ID3-Tags from passed buffer/filepath
**  filebuffer  => Buffer || String
**  tags        => Object
**  fn          => function (for asynchronous usage)
*/
NodeID3.prototype.update = function(tags, filebuffer, fn) {
    let rawTags = {}
    let SRawToNameMap = {}
    Object.keys(SFrames).map((key, index) => {
        SRawToNameMap[SFrames[key].name] = key
    })
    Object.keys(tags).map(function(tagKey) {
        //  if js name passed (TF)
        if(TFrames[tagKey]) {
            rawTags[TFrames[tagKey]] = tags[tagKey]

        //  if js name passed (WF)
        } else if(WFrames[tagKey]) {
            rawTags[WFrames[tagKey].name] = tags[tagKey]

        //  if js name passed (SF)
        } else if(SFrames[tagKey]) {
            rawTags[SFrames[tagKey].name] = tags[tagKey]

        //  if raw name passed (TF)
        } else if(Object.keys(TFrames).map(i => TFrames[i]).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]

        //  if raw name passed (WF)
        } else if(Object.keys(WFrames).map(i => WFrames[i]).map(x => x.name).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]

        //  if raw name passed (SF)
        } else if(Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]
        }
    })
    if(!fn || typeof fn !== 'function') {
        let currentTags = this.read(filebuffer)
        currentTags = currentTags.raw || {}
        //  update current tags with new or keep them
        Object.keys(rawTags).map(function(tag) {
            if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                const cCompare = {}
                currentTags[tag].forEach((cTag, index) => {
                    cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                })
                if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                rawTags[tag].forEach((rTag, index) => {
                    let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                    if(comparison !== undefined) {
                        currentTags[tag][comparison] = rTag
                    } else {
                        currentTags[tag].push(rTag)
                    }
                })
            } else {
                currentTags[tag] = rawTags[tag]
            }
        })
        return this.write(currentTags, filebuffer)
    } else {
        this.read(filebuffer, function(err, currentTags) {
            if(err) {
                fn(err)
                return
            }
            currentTags = currentTags.raw || {}
            //  update current tags with new or keep them
            Object.keys(rawTags).map(function(tag) {
                if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                    const cCompare = {}
                    currentTags[tag].forEach((cTag, index) => {
                        cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                    })
                    if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                    rawTags[tag].forEach((rTag, index) => {
                        let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                        if(comparison !== undefined) {
                            currentTags[tag][comparison] = rTag
                        } else {
                            currentTags[tag].push(rTag)
                        }
                    })
                } else {
                    currentTags[tag] = rawTags[tag]
                }
            })
            this.write(currentTags, filebuffer, fn)
        }.bind(this))
    }
}

/*
** Create URL frame
** specName =>  string (ID)
** text     =>  string (body)
*/
NodeID3.prototype.createUrlFrame = function(specName, text) {
    /* TODO CONVERT TO NEW STYLE */
    if(!specName || !text) {
        return null
    }

    let encoded = iconv.encode(text, "ISO-8859-1")

    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write(specName, 0)                           //  ID of the specified frame
    buffer.writeUInt32BE((encoded).length + 1, 4)       //  Size of frame (string length + encoding byte)
    let encBuffer = Buffer.alloc(1)                       //  Encoding (URLs are always ISO-8859-1)
    encBuffer.fill(0)                                   //  ISO-8859-1

    var contentBuffer = Buffer.from(encoded, 'binary')   //  Text -> Binary encoding for ISO-8859-1
    return Buffer.concat([buffer, encBuffer, contentBuffer])
}

NodeID3.prototype.createUserDefinedUrl = function(userDefinedUrl, recursiveBuffer) {
    /* TODO NEW VERSION */
    let udu = userDefinedUrl || {}
    if(udu instanceof Array && udu.length > 0) {
        if(!recursiveBuffer) {
            // Don't alter passed array value!
            userDefinedUrl = userDefinedUrl.slice(0)
        }
        udu = userDefinedUrl.shift()
    }

    if(udu && udu.description) {
        // Create frame header
        let buffer = Buffer.alloc(10)
        buffer.fill(0)
        buffer.write("WXXX", 0)                 //  Write header ID

        let encodingBuffer = this.createTextEncoding(0x01)
        let descriptorBuffer = this.createContentDescriptor(udu.description, 0x01, true)
        let urlBuffer = this.createText(udu.url, 0x00, false)

        buffer.writeUInt32BE(encodingBuffer.length + descriptorBuffer.length + urlBuffer.length, 4)
        if(!recursiveBuffer) {
            recursiveBuffer = Buffer.concat([buffer, encodingBuffer, descriptorBuffer, urlBuffer])
        } else {
            recursiveBuffer = Buffer.concat([recursiveBuffer, buffer, encodingBuffer, descriptorBuffer, urlBuffer])
        }
    }
    if(userDefinedUrl instanceof Array && userDefinedUrl.length > 0) {
        return this.createUserDefinedUrl(userDefinedUrl, recursiveBuffer)
    } else {
        return recursiveBuffer
    }
}

NodeID3.prototype.readUserDefinedUrl = function(frame) {
    /* TODO NEW VERSION */
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            description: iconv.decode(frame, "ISO-8859-1").substring(1, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            url: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let description = frame.slice(1, descriptorEscape)
        let value = frame.slice(descriptorEscape + 2)

        tags = {
            description: iconv.decode(description, "utf16").replace(/\0/g, ""),
            url: iconv.decode(value, "ISO-8859-1").replace(/\0/g, "")
        }
    }

    return tags
}
