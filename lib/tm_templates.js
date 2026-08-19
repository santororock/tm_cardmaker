(function(global) {
    "use strict";

    const catalog = {
    green_normal: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__green_normal", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 542, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 612, width: 826, height: 26, color: "#24770d", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 770, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 667, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" }
        ]
    },
    green_big_bottom: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__green_big_bottom", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 490, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 562, width: 826, height: 26, color: "#24770d", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 770, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 617, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    green_small_bottom: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "green_small_bottom", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 593, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 664, width: 826, height: 26, color: "#24770d", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 770, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 720, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    blue_normal: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__blue_normal", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 676, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 798, width: 826, height: 26, color: "#0c5e84", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 100, y: 860, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "misc__arrow", x: 355, y: 265, width: 116, height: 55, params: "allimages allpreset" },
            { type: "text", data: "X##", x: 716, y: 805, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Effect or Action text!", x: 413, y: 360, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    blue_big_bottom: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__blue_big_bottom", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 628, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 753, width: 702, height: 26, color: "#0c5e84", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 100, y: 860, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 759, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "misc__arrow", x: 355, y: 265, width: 116, height: 55, params: "allimages allpreset" },
            { type: "text", data: "Effect or Action text!", x: 413, y: 360, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    blue_big_top: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__blue_big_top", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 724, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 849, width: 702, height: 26, color: "#0c5e84", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 100, y: 891, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 856, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "misc__arrow", x: 355, y: 265, width: 116, height: 55, params: "allimages allpreset" },
            { type: "text", data: "Effect or Action text!", x: 413, y: 360, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    red_normal: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__red_normal", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 593, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 685, width: 826, height: 26, color: "#c36a17", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 100, y: 810, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 713, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    red_small_bottom: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__red_small_bottom", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 625, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 214, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 718, width: 826, height: 26, color: "#c36a17", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 100, y: 810, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 745, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    cosmic_horror_normal: {
        layers: [
            { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" },
            { type: "block", src: "templates__cosmic_horror_normal", x: 0, y: 0, width: 826, height: 1126, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 743, y: 485, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 425, y: 1069, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Cost", x: 118, y: 147, width: 826, height: 66, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "requisites__normal", x: 179, y: 97, width: 22, height: 59, params: "allimages allpreset" },
            { type: "text", data: "CARD NAME", x: 413, y: 208, width: 826, height: 46, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 413, y: 627, width: 826, height: 26, color: "#933da9", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 770, width: 826, height: 26, color: "#000000", font: '"Palatino Linotype", "Palatino", "Book Antiqua", serif', style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 716, y: 645, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 413, y: 1005, width: 826, height: 26, color: "#000000", font: '"Palatino Linotype", "Palatino", "Book Antiqua", serif', style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" }
        ]
    },
    prelude: {
        layers: [
            { type: "base", color: "#ffffff", height: 826, width: 1126, params: "color" },
            { type: "block", src: "templates__prelude", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 1031, y: 431, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 563, y: 766, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "CARD NAME", x: 563, y: 218, width: 826, height: 48, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 563, y: 500, width: 826, height: 26, color: "#ce809f", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "P R E L U D E", x: 563, y: 99, width: 826, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 560, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 1002, y: 519, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 563, y: 723, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    prelude_big_bottom: {
        layers: [
            { type: "base", color: "#ffffff", height: 826, width: 1126, params: "color" },
            { type: "block", src: "templates__prelude_big_bottom", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 1031, y: 385, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 563, y: 766, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "CARD NAME", x: 563, y: 218, width: 826, height: 48, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 563, y: 456, width: 826, height: 26, color: "#ce809f", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "P R E L U D E", x: 563, y: 99, width: 826, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 560, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 1002, y: 475, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 563, y: 723, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    prelude2_01: {
        layers: [
            { type: "base", color: "#ffffff", height: 826, width: 1126, params: "color" },
            { type: "block", src: "templates__prelude2_01", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "block", src: "templates__prelude2_02", x: 381, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "block", src: "templates__prelude2_03", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 555, y: 419, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 563, y: 766, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "CARD NAME", x: 563, y: 218, width: 826, height: 48, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 563, y: 500, width: 826, height: 26, color: "#ce809f", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "P R E L U D E", x: 563, y: 99, width: 826, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", name: "", src: "misc__effect", x: 631, y: 238, width: 345.79, height: 36, params: "allimages" },
            { type: "text", data: "E F F E C T  |  A C T I O N", x: 800, y: 263, width: 1126, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 560, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 1002, y: 519, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 563, y: 723, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    prelude2_small_bottom_01: {
        layers: [
            { type: "base", color: "#ffffff", height: 826, width: 1126, params: "color" },
            { type: "block", src: "templates__prelude2_small_bottom_01", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "block", src: "templates__prelude2_small_bottom_02", x: 330, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "block", src: "templates__prelude2_small_bottom_03", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 555, y: 570, width: 300, height: 12, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 563, y: 766, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "CARD NAME", x: 563, y: 218, width: 826, height: 48, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "FAN MADE", x: 563, y: 654, width: 826, height: 26, color: "#ce809f", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "P R E L U D E", x: 563, y: 99, width: 826, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", name: "", src: "misc__effect", x: 631, y: 238, width: 345.79, height: 36, params: "allimages" },
            { type: "text", data: "E F F E C T  |  A C T I O N", x: 800, y: 263, width: 1126, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "block", src: "misc__arrow", x: 745, y: 309, width: 116, height: 55, params: "allimages allpreset" },
            { type: "text", data: "Effect or Action text!", x: 804, y: 400, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 1002, y: 673, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Flavor text!", x: 563, y: 723, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    corporation: {
        layers: [
            { type: "base", color: "#ffffff", height: 826, width: 1126, params: "color" },
            { type: "block", src: "misc__corp_tag_holder", x: 969, y: 103, width: 257, height: 89, params: "allimages" },
            { type: "block", src: "templates__corporation", x: 0, y: 0, width: 1126, height: 826, params: "allimages allpreset" },
            { type: "text", data: "ART ATTRIBUTION", angle: -90, x: 1052, y: 626, width: 300, height: 11, color: "#ffffff", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "Card Designer(s)", x: 563, y: 766, width: 400, height: 11, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "effect", x: 600, y: 300, width: 400, height: 300, params: "allimages allpreset" },
            { type: "block", name: "", src: "misc__effect", x: 631, y: 307, width: 345.79, height: 36, params: "allimages" },
            { type: "block", name: "", src: "misc__card_number_box", x: 947, y: 607, width: 54, height: 27, params: "allimages" },
            { type: "text", data: "E F F E C T", x: 800, y: 333, width: 1126, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", "data": "FAN MADE", x: 198, y: 736, width: 826, height: 26, color: "#c3c3c3", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", "data": "C O R P O R A T I O N", x: 563, y: 109, width: 826, height: 26, color: "#000000", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", "data": "Card description\nMultiple lines\nand they can be much, much, much longer\n'V space' controls the spacing between lines", x: 110, y: 560, width: 826, height: 26, color: "#000000", font: "Pagella", style: "normal", weight: "normal", lineSpace: 4, justify: "left", params: "allimages color alltext allangle allpreset" },
            { type: "text", data: "X##", x: 973, y: 626, width: 60, height: 17, color: "#4D4D4D", font: "Prototype", style: "normal", weight: "normal", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
            { type: "text", "data": "Flavor text!", x: 563, y: 723, width: 826, height: 26, color: "#000000", font: "Pagella", style: "italic", weight: "bold", lineSpace: 4, justify: "center", params: "allimages color alltext allangle allpreset" },
        ]
    },
    debug_sprite_sheet: {
        /**
         * Dynamic layer generation function for debug sprite sheet
         * 
         * This function (not IIFE) generates a comprehensive sprite sheet showing
         * all block assets. It runs when the template is loaded, ensuring blockList
         * is populated with data from assets.json.
         * 
         * Key concepts demonstrated:
         * - Dynamic content generation based on runtime data
         * - Aspect ratio preservation through scale calculations
         * - Grid layout with automatic positioning
         * 
         * @returns {Array} Array of layer objects to be rendered
         */
        layers: function() {
            // Generate a debug sprite sheet with ALL block assets
            // This runs when the template is loaded, so blockList is populated
            const layers = [];
            const canvasWidth = 3200;
            const labelHeight = 30; // Reserve space for text labels

            // Placeholder for base layer - will be added after we calculate final height

            // Category configurations: columns, cellWidth, cellHeight, maxWidth, maxHeight
            // Images will be scaled to fit within maxW x maxH while maintaining aspect ratio
            // Note: maxH is reduced to leave room for text labels at the bottom
            const categoryConfig = {
                'blocks/templates': { cols: 8, cellW: 400, cellH: 400, maxW: 360, maxH: 340 },
                'blocks/globalparameters': { cols: 6, cellW: 180, cellH: 180, maxW: 150, maxH: 130 },
                'blocks/tags': { cols: 6, cellW: 150, cellH: 150, maxW: 120, maxH: 105 },
                'blocks/resources': { cols: 6, cellW: 150, cellH: 150, maxW: 120, maxH: 105 },
                'blocks/misc': { cols: 8, cellW: 130, cellH: 130, maxW: 110, maxH: 95 },
                'blocks/parties': { cols: 6, cellW: 200, cellH: 180, maxW: 180, maxH: 130 },
                'blocks/requisites': { cols: 6, cellW: 220, cellH: 100, maxW: 210, maxH: 70 },
                'blocks/tiles': { cols: 6, cellW: 180, cellH: 180, maxW: 160, maxH: 135 },
                'blocks/VPs': { cols: 4, cellW: 260, cellH: 260, maxW: 240, maxH: 215 },
                'blocks/productionboxes': { cols: 6, cellW: 180, cellH: 180, maxW: 150, maxH: 135 },
                'blocks/expansions': { cols: 8, cellW: 120, cellH: 120, maxW: 90, maxH: 90 }
            };

            // Group assets by category (putUnder field)
            // This creates an object like: { templates: [...], tags: [...], etc. }
            const grouped = {};
            for (let i = 0; i < blockList.length; i++) {
                const asset = blockList[i];
                // Skip the debug_sprite_sheet entry itself to avoid recursion
                if (asset.src === 'debug_sprite_sheet') continue;
                const category = asset.putUnder;
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push(asset);
            }

            // Layout each category section on the sprite sheet
            let currentY = 50; // Start position from top
            // Process categories in a specific order for consistent layout
            const categoryOrder = ['blocks/templates', 'blocks/globalparameters', 'blocks/tags', 'blocks/resources', 'blocks/misc', 'blocks/parties', 'blocks/requisites', 'blocks/tiles', 'blocks/VPs', 'blocks/productionboxes', 'blocks/expansions'];
            const categorySet = new Set(Object.keys(grouped));
            const orderedCategories = categoryOrder.filter((cat) => categorySet.has(cat));
            const remainingCategories = Array.from(categorySet)
                .filter((cat) => orderedCategories.indexOf(cat) === -1)
                .sort();
            const finalCategoryOrder = orderedCategories.concat(remainingCategories);

            for (const category of finalCategoryOrder) {
                // Skip if this category has no assets
                if (!grouped[category] || grouped[category].length === 0) continue;

                const config = categoryConfig[category] || { cols: 6, cellW: 160, cellH: 160, maxW: 140, maxH: 120 };
                const assets = grouped[category];

                // Add category header text layer
                const headerText = category.toUpperCase().replace(/_/g, ' ');
                layers.push({
                    type: "text",
                    data: headerText,
                    x: canvasWidth / 2,
                    y: currentY,
                    width: canvasWidth,
                    height: 32,
                    color: "#000000",
                    font: "Prototype",
                    style: "normal",
                    weight: "bold",
                    lineSpace: 4,
                    justify: "center",
                    params: "alltext color"
                });

                currentY += 50; // Space after header

                // Layout assets in grid
                const availableWidth = canvasWidth - 100; // left/right margin = 50 each
                // Estimate average display size for this category (after scaling)
                let avgDisplayW = 0;
                let avgDisplayH = 0;
                for (let i = 0; i < assets.length; i++) {
                    const imgW = assets[i].width || 100;
                    const imgH = assets[i].height || 100;
                    const scaleW = config.maxW / imgW;
                    const scaleH = config.maxH / imgH;
                    const scale = Math.min(scaleW, scaleH);
                    avgDisplayW += imgW * scale;
                    avgDisplayH += imgH * scale;
                }
                if (assets.length > 0) {
                    avgDisplayW /= assets.length;
                    avgDisplayH /= assets.length;
                } else {
                    avgDisplayW = config.maxW;
                    avgDisplayH = config.maxH;
                }

                const paddingX = 20;
                const desiredCellW = Math.max(80, Math.round(avgDisplayW + paddingX));
                const cols = Math.max(1, Math.floor(availableWidth / desiredCellW));
                const cellW = Math.floor(availableWidth / cols);
                const gridWidth = cols * cellW;
                const startX = Math.max(50, Math.round((canvasWidth - gridWidth) / 2));
                let col = 0; // Current column position
                let row = 0; // Current row position

                for (let i = 0; i < assets.length; i++) {
                    const asset = assets[i];

                    // Get actual image dimensions from the asset (populated by populate_dimensions.py)
                    // Default to 100x100 if dimensions are missing (shouldn't happen but safe fallback)
                    const imgW = asset.width || 100;
                    const imgH = asset.height || 100;

                    // Calculate scale factor to fit within max bounds while maintaining aspect ratio
                    // Key concept: We calculate two possible scales (one for width, one for height)
                    // and use whichever is smaller to ensure the image fits within both constraints
                    const scaleW = config.maxW / imgW; // How much to scale to fit width
                    const scaleH = config.maxH / imgH; // How much to scale to fit height
                    const scale = Math.min(scaleW, scaleH); // Use smaller scale to fit within both dimensions

                    // Calculate actual display dimensions by applying the scale
                    // Math.round ensures we get whole pixel values
                    const displayW = Math.round(imgW * scale);
                    const displayH = Math.round(imgH * scale);

                    // Calculate position to center image in its cell
                    const cellX = startX + col * cellW; // Left edge of cell
                    const cellY = currentY + row * config.cellH; // Top edge of cell

                    // Center the image horizontally
                    const x = cellX + (cellW - displayW) / 2;

                    // Position the image vertically with explicit separation from label
                    // Reserve space: top padding + image + gap + label
                    const topPadding = 10; // Padding from top of cell
                    const gapBeforeLabel = 15; // Explicit gap between image bottom and label top
                    const imageAreaHeight = config.cellH - labelHeight - gapBeforeLabel;
                    const y = cellY + topPadding + (imageAreaHeight - topPadding - displayH) / 2;

                    // Add the block layer with calculated dimensions
                    layers.push({
                        type: "block",
                        src: asset.src,
                        x: x,
                        y: y,
                        width: displayW,
                        height: displayH,
                        params: "allimages"
                    });

                    // Add text label at bottom of cell
                    const labelY = cellY + config.cellH - labelHeight;
                    const displayText = asset.text || asset.src.replace(/_/g, ' ');
                    layers.push({
                        type: "text",
                        data: displayText,
                        x: cellX + cellW / 2, // Center of cell
                        y: labelY,
                        width: cellW,
                        height: 18, // Increased from 12 for better readability
                        color: "#333333",
                        font: "Pagella",
                        style: "normal",
                        weight: "normal",
                        lineSpace: 2,
                        justify: "center",
                        params: "alltext color"
                    });

                    // Move to next cell position
                    col++;
                    // If we've filled all columns in this row, wrap to next row
                    if (col >= cols) {
                        col = 0; // Reset to first column
                        row++; // Move down one row
                    }
                }

                // Calculate total vertical space used by this category
                // Math.ceil handles partial rows (e.g., 7 items in 6 columns = 2 rows)
                const rowsUsed = Math.ceil(assets.length / cols);
                currentY += rowsUsed * config.cellH + 70; // Move down for next category with extra spacing
            }

            // Calculate final canvas height based on actual content
            const canvasHeight = currentY + 50; // Add bottom padding

            // Insert base layer at the beginning with calculated height
            layers.unshift({ type: "base", color: "#e8e8e8", height: canvasHeight, width: canvasWidth, params: "color" });

            // Return the complete array of layers to be rendered
            return layers;
        }
    }
};

    function loadSelectedTemplate() {
    console.log("[TEMPLATE] loadSelectedTemplate called, this.id:", this.id);
    if (!confirm("All current data will be discarded. Continue?")) return;
    if (this.id.slice(0, 4) != "mega") return;
    let mega = this.id.slice(4);
    console.log("[TEMPLATE] Loading template:", mega);
    if (!catalog[mega]) {
        console.error("[TEMPLATE] Template not found:", mega);
        return;
    }
    clearUndoHistory();
    document.getElementById("layerlist").innerHTML = "";
    ddcount = 0;
    aLayers = projectState.reset();
    addLayer("Base", { type: "base", color: "#ffffff", height: 1126, width: 826, params: "color" });

    /**
     * Support layers as a function (for dynamic generation like debug_sprite_sheet)
     * 
     * Why check typeof?
     * - Most templates have static layers: { layers: [{type:"block",...}, ...] }
     * - Dynamic templates have a function: { layers: function() { return [...]; } }
     * - We detect which type and handle appropriately
     * 
     * The function approach is essential when layer content depends on runtime data
     * that isn't available when the JavaScript file is parsed (e.g., assets.json data)
     */
    let layers = catalog[mega].layers;
    if (typeof layers === 'function') {
        layers = layers(); // Call the function to generate layers array
    }
    // At this point, layers is always an array, regardless of source
    console.log("[TEMPLATE] Loading", layers.length, "layers");

    loadFrom(layers);
    captureInitialState("Load template: " + mega);

    // Reset canvas view (center and scale) after loading template
    if (typeof zoomCanvasReset === 'function') {
        zoomCanvasReset();
    }
}

    global.TMCardMakerTemplates = Object.freeze({ catalog, loadSelectedTemplate });
})(window);
