function encodeHTMLSpecialWord(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/\'/g, "&#x27;")
        .replace(/`/g, "&#x60")
        .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
        .replace(/(?:\\[rn]|[\r\n]+)+/g, "<BR>")
        .replace(/\s/g, "&nbsp;");
};

function decodeHTMLSpecialWord(str) {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x60/g, "`");
};
