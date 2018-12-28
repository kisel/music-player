
export namespace LocalStorage {
    const localStorage: any = window.localStorage || {};
    const trueString = "true";

    export function setBool(key: string, val: boolean) {
        if (val) {
            localStorage[key] = trueString;
        } else {
            localStorage.removeItem(key);
        }
    }

    export function setString(key: string, val: string) {
        if (val) {
            localStorage[key] = val;
        } else {
            localStorage.removeItem(key);
        }
    }

    export function getBool(key: string): boolean {
        return localStorage[key] === trueString;
    }

    export function getString(key: string, defVal: string = null): string {
        return localStorage[key] || defVal;
    }

    export function setNumber(key: string, val: number) {
        setString(key, `${val}`);
    }
    export function getNumber(key: string, defVal: number = null): number {
        const val = getString(key);
        return val ? parseFloat(val) : defVal;
    }

    export function getLocalStorage() {
        return localStorage;
    }
}

