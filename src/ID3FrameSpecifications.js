const Visibilities = {
    INTERNAL: "internal",
    VALUE: "value"
};

const Types = {
    STATIC_DATA: "staticData",
    NULL_TERMINATED: "nullTerminated",
    SUBFRAMES: "subframes"
};

module.exports = {
    TextInformationFrame: [
        {
            name: "encodingByte",
            visibility: Visibilities.INTERNAL,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            dataType: "string",
            encoding: "encodingByte"
        }
    ],

    UserDefinedTextFrame: [
        {
            name: "encodingByte",
            visibility: Visibilities.INTERNAL,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "description",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string",
            encoding: "encodingByte"
        },
        {
            name: "value",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            dataType: "string",
            encoding: "encodingByte"
        }
    ],

    AttachedPictureFrame: [
        {
            name: "encodingByte",
            visibility: Visibilities.INTERNAL,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "mime",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string"
        },
        {
            name: "type.id",
            type: Types.STATIC_DATA,
            visibility: Visibilities.VALUE,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "description",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string",
            encoding: "encodingByte"
        },
        {
            name: "imageBuffer",
            type: Types.STATIC_DATA
        }
    ],

    UnsynchronisedLyricsFrame: [
        {
            name: "encodingByte",
            visibility: Visibilities.INTERNAL,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "language",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 3
            },
            dataType: "string"
        },
        {
            name: "description",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string",
            encoding: "encodingByte"
        },
        {
            name: "text",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            dataType: "string",
            encoding: "encodingByte"
        }
    ],

    CommentFrame: [
        {
            name: "encodingByte",
            visibility: Visibilities.INTERNAL,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "language",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 3
            },
            dataType: "string"
        },
        {
            name: "description",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string",
            encoding: "encodingByte"
        },
        {
            name: "text",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            dataType: "string",
            encoding: "encodingByte"
        }
    ],

    PopularimeterFrame: [
        {
            name: "email",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string"
        },
        {
            name: "rating",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 1
            },
            dataType: "number"
        },
        {
            name: "counter",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 4
            },
            dataType: "number"
        }
    ],

    PrivateFrame: [
        {
            name: "ownerIdentifier",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string"
        },
        {
            name: "data",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            encoding: 0x01
        }
    ],

    ChapterFrame: [
        {
            name: "elementID",
            visibility: Visibilities.VALUE,
            type: Types.NULL_TERMINATED,
            dataType: "string"
        },
        {
            name: "startTimeMs",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 4
            },
            dataType: "number"
        },
        {
            name: "endTimeMs",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 4
            },
            dataType: "number"
        },
        {
            name: "startOffsetBytes",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size:4
            },
            dataType: "number",
            optional: true
        },
        {
            name: "endOffsetBytes",
            visibility: Visibilities.VALUE,
            type: Types.STATIC_DATA,
            options: {
                size: 4
            },
            dataType: "number",
            optional: true
        },
        {
            name: "tags",
            visibility: Visibilities.VALUE,
            type: Types.SUBFRAMES,
            optional: true
        }
    ]
};

module.exports.Visibilities = Visibilities;
module.exports.Types = Types;
