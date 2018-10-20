
export function matchInAttributes(data: any, attributes: string[], filter: RegExp) {
    for (const attr of attributes) {
        const val = data[attr];
        if (val && filter.test(val)) {
            return true;
        }
    }
    return false;
}

export const regExpEscape = function(s) {
    return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
        replace(/\x08/g, '\\x08');
  };

export function buildFuzzySearch(expr: string): RegExp {
    try {
        expr = expr.replace(" ", ".*");
        return new RegExp(expr, "i");
    } catch(e) {
        return new RegExp(regExpEscape(expr), "i");
    }
}

