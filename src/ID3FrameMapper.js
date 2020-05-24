const ID3Frame = require('./ID3Frame');

module.exports = {};

const ID3FrameMap = {
    "T___": ID3Frame.TextInformationFrame,
    "TXXX": ID3Frame.UserDefinedTextFrame,
    "APIC": ID3Frame.AttachedPictureFrame,
    "USLT": ID3Frame.UnsynchronisedLyricsFrame,
    "COMM": ID3Frame.CommentFrame,
    "POPM": ID3Frame.PopularimeterFrame,
    "PRIV": ID3Frame.PrivateFrame,
    "CHAP": ID3Frame.ChapterFrame
};

const ID3FrameOptions = {
    "T___": {
        multiple: false
    },
    "TXXX": {
        multiple: true,
        compareKey: "description"
    },
    "APIC": {
        multiple: false
    },
    "USLT": {
        multiple: false
    },
    "COMM": {
        multiple: true
    },
    "POPM": {
        multiple: true
    },
    "PRIV": {
        multiple: true
    },
    "CHAP": {
        multiple: true
    }
};

/*
**  List of official text information frames
**  LibraryName: "T***"
**  Value is the ID of the text frame specified in the link above, the object's keys are just for simplicity, you can also use the ID directly.
*/
const ID3v230NameToIdentifier = {
    album:              "TALB",
    bpm:                "TBPM",
    composer:           "TCOM",
    genre:              "TCON",
    copyright:          "TCOP",
    date:               "TDAT",
    playlistDelay:      "TDLY",
    encodedBy:          "TENC",
    textWriter:         "TEXT",
    fileType:           "TFLT",
    time:               "TIME",
    contentGroup:       "TIT1",
    title:              "TIT2",
    subtitle:           "TIT3",
    initialKey:         "TKEY",
    language:           "TLAN",
    length:             "TLEN",
    mediaType:          "TMED",
    originalTitle:      "TOAL",
    originalFilename:   "TOFN",
    originalTextwriter: "TOLY",
    originalArtist:     "TOPE",
    originalYear:       "TORY",
    fileOwner:          "TOWN",
    artist:             "TPE1",
    performerInfo:      "TPE2",
    conductor:          "TPE3",
    remixArtist:        "TPE4",
    partOfSet:          "TPOS",
    publisher:          "TPUB",
    trackNumber:        "TRCK",
    recordingDates:     "TRDA",
    internetRadioName:  "TRSN",
    internetRadioOwner: "TRSO",
    size:               "TSIZ",
    ISRC:               "TSRC",
    encodingTechnology: "TSSE",
    year:               "TYER",
    userDefinedText:    "TXXX",
    picture:            "APIC",
    unsynchronisedLyrics: "USLT",
    comment:            "COMM",
    popularimeter:      "POPM",
    private:            "PRIV",
    chapter:            "CHAP"
};

const ID3v220NameToIdentifier = {
    album:              "TAL",
    bpm:                "TBP",
    composer:           "TCM",
    genre:              "TCO",
    copyright:          "TCR",
    date:               "TDA",
    playlistDelay:      "TDY",
    encodedBy:          "TEN",
    textWriter:         "TEXT",
    fileType:           "TFT",
    time:               "TIM",
    contentGroup:       "TT1",
    title:              "TT2",
    subtitle:           "TT3",
    initialKey:         "TKE",
    language:           "TLA",
    length:             "TLE",
    mediaType:          "TMT",
    originalTitle:      "TOT",
    originalFilename:   "TOF",
    originalTextwriter: "TOL",
    originalArtist:     "TOA",
    originalYear:       "TOR",
    artist:             "TP1",
    performerInfo:      "TP2",
    conductor:          "TP3",
    remixArtist:        "TP4",
    partOfSet:          "TPA",
    publisher:          "TPB",
    trackNumber:        "TRK",
    recordingDates:     "TRD",
    size:               "TSI",
    ISRC:               "TRC",
    encodingTechnology: "TSS",
    year:               "TYE"
};

/**
 *
 * @return {string, null}
 */
module.exports.getFrameIdentifier = function(name, version = 3) {
    if(!name) return null;
    if(version === 2) {
        return ID3v220NameToIdentifier[name] || (Object.values(ID3v220NameToIdentifier).indexOf(name) !== -1 ? name : null);
    }
    if(version >= 3) {
        return ID3v230NameToIdentifier[name] || (Object.values(ID3v230NameToIdentifier).indexOf(name) !== -1 ? name : null);
    }
    return null;
};

/**
 *
 * @return {string, null}
 */
module.exports.getFrameName = function(identifier, version = 3) {
    if(!identifier) return null;
    if(version === 2) {
        return Object.keys(ID3v220NameToIdentifier).find(key => ID3v220NameToIdentifier[key] === identifier);
    }
    if(version >= 3) {
        return Object.keys(ID3v230NameToIdentifier).find(key => ID3v230NameToIdentifier[key] === identifier);
    }
    return null;
};

/**
 *
 * @return {ID3Frame, null}
 */
module.exports.getFrameType = function(name) {
    name = this.getFrameIdentifier(name);
    if(!name) return null;

    if(name.startsWith("T") && name !== "TXXX") {
        return ID3FrameMap["T___"];
    }
    if(ID3FrameMap[name] !== undefined) {
        return ID3FrameMap[name];
    }
    return null;
};

module.exports.getFrameOptions = function(name) {
    return ID3FrameOptions[this.getFrameIdentifier(name) || "T___"] || {};
};
