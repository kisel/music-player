
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

    export function getString(key: string, defVal: string = ''): string {
        return localStorage[key] || defVal;
    }

    export function getLocalStorage() {
        return localStorage;
    }
}

