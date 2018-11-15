
function matchInAttributes(data: any, attributes: string[], filter: RegExp) {
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

export function dumbAttribFilter(elements: any[], searchQuery: string, attributes: string[]) {
    let res = [];
    const words = searchQuery.toLowerCase().split(/ +/)
    for (const el of elements) {
        let skip_el = false;
        for (const w of words) {
            let found_w = false;
            for (const attr of attributes) {
                const val = el[attr];
                if (typeof(val)==='string' &&  val.toLowerCase().search(w) != -1) {
                    found_w = true;
                    break;
                }
            }
            if (!found_w) {
                skip_el = true;
                break;
            }
        }
        if (!skip_el) {
            res.push(el)
        }
    }
    return res;
}

