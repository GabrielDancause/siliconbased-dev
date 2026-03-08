import fs from 'fs';
import path from 'path';

// All 148 standard CSS named colors
const cssColors = [
    { name: "aliceblue", hex: "#f0f8ff" },
    { name: "antiquewhite", hex: "#faebd7" },
    { name: "aqua", hex: "#00ffff" },
    { name: "aquamarine", hex: "#7fffd4" },
    { name: "azure", hex: "#f0ffff" },
    { name: "beige", hex: "#f5f5dc" },
    { name: "bisque", hex: "#ffe4c4" },
    { name: "black", hex: "#000000" },
    { name: "blanchedalmond", hex: "#ffebcd" },
    { name: "blue", hex: "#0000ff" },
    { name: "blueviolet", hex: "#8a2be2" },
    { name: "brown", hex: "#a52a2a" },
    { name: "burlywood", hex: "#deb887" },
    { name: "cadetblue", hex: "#5f9ea0" },
    { name: "chartreuse", hex: "#7fff00" },
    { name: "chocolate", hex: "#d2691e" },
    { name: "coral", hex: "#ff7f50" },
    { name: "cornflowerblue", hex: "#6495ed" },
    { name: "cornsilk", hex: "#fff8dc" },
    { name: "crimson", hex: "#dc143c" },
    { name: "cyan", hex: "#00ffff" },
    { name: "darkblue", hex: "#00008b" },
    { name: "darkcyan", hex: "#008b8b" },
    { name: "darkgoldenrod", hex: "#b8860b" },
    { name: "darkgray", hex: "#a9a9a9" },
    { name: "darkgreen", hex: "#006400" },
    { name: "darkgrey", hex: "#a9a9a9" },
    { name: "darkkhaki", hex: "#bdb76b" },
    { name: "darkmagenta", hex: "#8b008b" },
    { name: "darkolivegreen", hex: "#556b2f" },
    { name: "darkorange", hex: "#ff8c00" },
    { name: "darkorchid", hex: "#9932cc" },
    { name: "darkred", hex: "#8b0000" },
    { name: "darksalmon", hex: "#e9967a" },
    { name: "darkseagreen", hex: "#8fbc8f" },
    { name: "darkslateblue", hex: "#483d8b" },
    { name: "darkslategray", hex: "#2f4f4f" },
    { name: "darkslategrey", hex: "#2f4f4f" },
    { name: "darkturquoise", hex: "#00ced1" },
    { name: "darkviolet", hex: "#9400d3" },
    { name: "deeppink", hex: "#ff1493" },
    { name: "deepskyblue", hex: "#00bfff" },
    { name: "dimgray", hex: "#696969" },
    { name: "dimgrey", hex: "#696969" },
    { name: "dodgerblue", hex: "#1e90ff" },
    { name: "firebrick", hex: "#b22222" },
    { name: "floralwhite", hex: "#fffaf0" },
    { name: "forestgreen", hex: "#228b22" },
    { name: "fuchsia", hex: "#ff00ff" },
    { name: "gainsboro", hex: "#dcdcdc" },
    { name: "ghostwhite", hex: "#f8f8ff" },
    { name: "gold", hex: "#ffd700" },
    { name: "goldenrod", hex: "#daa520" },
    { name: "gray", hex: "#808080" },
    { name: "green", hex: "#008000" },
    { name: "greenyellow", hex: "#adff2f" },
    { name: "grey", hex: "#808080" },
    { name: "honeydew", hex: "#f0fff0" },
    { name: "hotpink", hex: "#ff69b4" },
    { name: "indianred", hex: "#cd5c5c" },
    { name: "indigo", hex: "#4b0082" },
    { name: "ivory", hex: "#fffff0" },
    { name: "khaki", hex: "#f0e68c" },
    { name: "lavender", hex: "#e6e6fa" },
    { name: "lavenderblush", hex: "#fff0f5" },
    { name: "lawngreen", hex: "#7cfc00" },
    { name: "lemonchiffon", hex: "#fffacd" },
    { name: "lightblue", hex: "#add8e6" },
    { name: "lightcoral", hex: "#f08080" },
    { name: "lightcyan", hex: "#e0ffff" },
    { name: "lightgoldenrodyellow", hex: "#fafad2" },
    { name: "lightgray", hex: "#d3d3d3" },
    { name: "lightgreen", hex: "#90ee90" },
    { name: "lightgrey", hex: "#d3d3d3" },
    { name: "lightpink", hex: "#ffb6c1" },
    { name: "lightsalmon", hex: "#ffa07a" },
    { name: "lightseagreen", hex: "#20b2aa" },
    { name: "lightskyblue", hex: "#87cefa" },
    { name: "lightslategray", hex: "#778899" },
    { name: "lightslategrey", hex: "#778899" },
    { name: "lightsteelblue", hex: "#b0c4de" },
    { name: "lightyellow", hex: "#ffffe0" },
    { name: "lime", hex: "#00ff00" },
    { name: "limegreen", hex: "#32cd32" },
    { name: "linen", hex: "#faf0e6" },
    { name: "magenta", hex: "#ff00ff" },
    { name: "maroon", hex: "#800000" },
    { name: "mediumaquamarine", hex: "#66cdaa" },
    { name: "mediumblue", hex: "#0000cd" },
    { name: "mediumorchid", hex: "#ba55d3" },
    { name: "mediumpurple", hex: "#9370db" },
    { name: "mediumseagreen", hex: "#3cb371" },
    { name: "mediumslateblue", hex: "#7b68ee" },
    { name: "mediumspringgreen", hex: "#00fa9a" },
    { name: "mediumturquoise", hex: "#48d1cc" },
    { name: "mediumvioletred", hex: "#c71585" },
    { name: "midnightblue", hex: "#191970" },
    { name: "mintcream", hex: "#f5fffa" },
    { name: "mistyrose", hex: "#ffe4e1" },
    { name: "moccasin", hex: "#ffe4b5" },
    { name: "navajowhite", hex: "#ffdead" },
    { name: "navy", hex: "#000080" },
    { name: "oldlace", hex: "#fdf5e6" },
    { name: "olive", hex: "#808000" },
    { name: "olivedrab", hex: "#6b8e23" },
    { name: "orange", hex: "#ffa500" },
    { name: "orangered", hex: "#ff4500" },
    { name: "orchid", hex: "#da70d6" },
    { name: "palegoldenrod", hex: "#eee8aa" },
    { name: "palegreen", hex: "#98fb98" },
    { name: "paleturquoise", hex: "#afeeee" },
    { name: "palevioletred", hex: "#db7093" },
    { name: "papayawhip", hex: "#ffefd5" },
    { name: "peachpuff", hex: "#ffdab9" },
    { name: "peru", hex: "#cd853f" },
    { name: "pink", hex: "#ffc0cb" },
    { name: "plum", hex: "#dda0dd" },
    { name: "powderblue", hex: "#b0e0e6" },
    { name: "purple", hex: "#800080" },
    { name: "rebeccapurple", hex: "#663399" },
    { name: "red", hex: "#ff0000" },
    { name: "rosybrown", hex: "#bc8f8f" },
    { name: "royalblue", hex: "#4169e1" },
    { name: "saddlebrown", hex: "#8b4513" },
    { name: "salmon", hex: "#fa8072" },
    { name: "sandybrown", hex: "#f4a460" },
    { name: "seagreen", hex: "#2e8b57" },
    { name: "seashell", hex: "#fff5ee" },
    { name: "sienna", hex: "#a0522d" },
    { name: "silver", hex: "#c0c0c0" },
    { name: "skyblue", hex: "#87ceeb" },
    { name: "slateblue", hex: "#6a5acd" },
    { name: "slategray", hex: "#708090" },
    { name: "slategrey", hex: "#708090" },
    { name: "snow", hex: "#fffafa" },
    { name: "springgreen", hex: "#00ff7f" },
    { name: "steelblue", hex: "#4682b4" },
    { name: "tan", hex: "#d2b48c" },
    { name: "teal", hex: "#008080" },
    { name: "thistle", hex: "#d8bfd8" },
    { name: "tomato", hex: "#ff6347" },
    { name: "turquoise", hex: "#40e0d0" },
    { name: "violet", hex: "#ee82ee" },
    { name: "wheat", hex: "#f5deb3" },
    { name: "white", hex: "#ffffff" },
    { name: "whitesmoke", hex: "#f5f5f5" },
    { name: "yellow", hex: "#ffff00" },
    { name: "yellowgreen", hex: "#9acd32" }
];

function hexToRgb(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return { r, g, b, string: `rgb(${r}, ${g}, ${b})` };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
        string: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    };
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Calculate relative luminance for accessibility contrast
function getLuminance(r, g, b) {
    const a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Determine broad category based on HSL
function getCategory(h, s, l) {
    if (l < 10) return 'black';
    if (l > 90) return 'white';
    if (s < 10) return 'gray';

    if (h >= 0 && h < 30) return 'red';
    if (h >= 30 && h < 60) return 'orange';
    if (h >= 60 && h < 90) return 'yellow';
    if (h >= 90 && h < 150) return 'green';
    if (h >= 150 && h < 210) return 'cyan'; // Actually some aquas/cyans, let's group to blue/green
    if (h >= 150 && h < 250) return 'blue';
    if (h >= 250 && h < 300) return 'purple';
    if (h >= 300 && h < 340) return 'pink';
    if (h >= 340 && h <= 360) return 'red';

    return 'other';
}

function getCategoryBetter(name, h, s, l) {
    // Custom overrides based on names/standard groupings
    if (name.includes('brown') || name.includes('chocolate') || name.includes('sienna') || name.includes('peru') || name.includes('burlywood') || name === 'tan') return 'brown';
    if (name.includes('pink') || name === 'fuchsia' || name === 'magenta' || name.includes('rose')) return 'pink';
    if (name.includes('purple') || name.includes('violet') || name.includes('orchid') || name.includes('indigo') || name === 'plum' || name.includes('thistle') || name === 'lavender') return 'purple';
    if (name.includes('blue') || name.includes('cyan') || name === 'aqua' || name === 'azure' || name === 'navy' || name === 'teal') return 'blue';
    if (name.includes('green') || name === 'lime' || name === 'olive' || name === 'chartreuse') return 'green';
    if (name.includes('yellow') || name === 'gold' || name === 'khaki') return 'yellow';
    if (name.includes('orange') || name === 'coral' || name === 'tomato' || name === 'salmon') return 'orange';
    if (name.includes('red') || name === 'crimson' || name === 'firebrick' || name === 'maroon') return 'red';
    if (name.includes('grey') || name.includes('gray') || name === 'silver' || name === 'gainsboro') return 'gray';
    if (name.includes('white') || name === 'snow' || name === 'ivory' || name === 'mintcream' || name === 'seashell' || name === 'honeydew' || name === 'aliceblue' || name === 'ghostwhite' || name === 'linen' || name === 'oldlace') return 'white';
    if (name === 'black') return 'black';

    // Fallback logic
    if (l < 15) return 'black';
    if (l > 85 && s < 20) return 'white';
    if (s < 15) return 'gray';

    if (h >= 345 || h < 15) return 'red';
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 70) return 'yellow';
    if (h >= 70 && h < 165) return 'green';
    if (h >= 165 && h < 260) return 'blue';
    if (h >= 260 && h < 315) return 'purple';
    if (h >= 315 && h < 345) return 'pink';

    return 'gray';
}

function findClosestColorName(hexTarget) {
    // Basic closest match based on distance in RGB space
    const targetRgb = hexToRgb(hexTarget);
    let closestName = "";
    let closestDistance = Infinity;

    for (const c of cssColors) {
        const cRgb = hexToRgb(c.hex);
        const dist = Math.pow(targetRgb.r - cRgb.r, 2) + Math.pow(targetRgb.g - cRgb.g, 2) + Math.pow(targetRgb.b - cRgb.b, 2);
        if (dist < closestDistance) {
            closestDistance = dist;
            closestName = c.name;
        }
    }
    return closestName;
}

const colorData = cssColors.map(color => {
    const rgb = hexToRgb(color.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    const isLight = luminance > 0.179; // Standard threshold for dark/light text

    // Harmonies (shifted HSL converted back to Hex, then finding nearest CSS color name, or just storing the calculated hex if no perfect match, but let's store hex and closest name)
    const compH = (hsl.h + 180) % 360;
    const compHex = hslToHex(compH, hsl.s, hsl.l);

    const ana1H = (hsl.h + 30) % 360;
    const ana2H = (hsl.h + 330) % 360;
    const ana1Hex = hslToHex(ana1H, hsl.s, hsl.l);
    const ana2Hex = hslToHex(ana2H, hsl.s, hsl.l);

    const tri1H = (hsl.h + 120) % 360;
    const tri2H = (hsl.h + 240) % 360;
    const tri1Hex = hslToHex(tri1H, hsl.s, hsl.l);
    const tri2Hex = hslToHex(tri2H, hsl.s, hsl.l);

    return {
        name: color.name,
        hex: color.hex,
        rgb: rgb,
        hsl: hsl,
        category: getCategoryBetter(color.name, hsl.h, hsl.s, hsl.l),
        luminance: luminance,
        isLight: isLight,
        complementary: { hex: compHex, closestMatch: findClosestColorName(compHex) },
        analogousColors: [
            { hex: ana1Hex, closestMatch: findClosestColorName(ana1Hex) },
            { hex: ana2Hex, closestMatch: findClosestColorName(ana2Hex) }
        ],
        triadicColors: [
            { hex: tri1Hex, closestMatch: findClosestColorName(tri1Hex) },
            { hex: tri2Hex, closestMatch: findClosestColorName(tri2Hex) }
        ]
    };
});

fs.writeFileSync(path.join(process.cwd(), 'data', 'css-colors.json'), JSON.stringify(colorData, null, 2));
console.log('Successfully generated data/css-colors.json with ' + colorData.length + ' colors.');
