import ReqMateCache from '../../../src/cache/ReqMateCache';

export default class LocalStorageCache implements ReqMateCache {

    constructor(public prefix: string = 'ReqMateCache_') { }

    private async getRaw(key: string): Promise<{ value: unknown, expiration?: number }> {
        const data = localStorage.getItem(this.prefix + key);
        return data ? JSON.parse(data) : null;
    }

    async has(key: string): Promise<boolean> {
        const raw = await this.getRaw(key);
        if (raw && (!raw.expiration || raw.expiration > Date.now())) {
            return true;
        }
        return false;
    }

    async set(key: string, value: unknown, ttl?: number): Promise<void> {
        const item = {
            value,
            expiration: ttl ? Date.now() + ttl * 1000 : undefined,
        };
        localStorage.setItem(this.prefix + key, JSON.stringify(item));
    }

    async get(key: string): Promise<unknown> {
        const raw = await this.getRaw(key);
        if (raw && (!raw.expiration || raw.expiration > Date.now())) {
            return raw.value;
        }
        return null;
    }

    async delete(key: string): Promise<boolean> {
        if (await this.has(key)) {
            localStorage.removeItem(this.prefix + key);
            return true;
        }
        return false;
    }

    expire(key: string, ttl: number): void {
        this.getRaw(key).then(raw => {
            if (raw) {
                raw.expiration = Date.now() + ttl * 1000;
                localStorage.setItem(this.prefix + key, JSON.stringify(raw));
            }
        });
    }

    async clear(): Promise<void> {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith(this.prefix)) {
                localStorage.removeItem(k);
            }
        });
    }

    async size(): Promise<number> {
        return Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).length;
    }

    async keys(): Promise<IterableIterator<string>> {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).map(k => k.substr(this.prefix.length));
        return keys[Symbol.iterator]();
    }

    async values(): Promise<IterableIterator<unknown>> {
        const rawKeys = await this.keys();
        const keys = [...rawKeys];
        const values = keys.map(k => this.get(k));
        return values[Symbol.iterator]();
    }

    async entries(): Promise<IterableIterator<[string, unknown]>> {
        const rawkeys = await this.keys();
        const keys = [...rawkeys];
        const entries = keys.map(k => [k, this.get(k)] as [string, unknown]);
        return entries[Symbol.iterator]();
    }

    async forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): Promise<void> {
        const map = new Map<string, unknown>();
        const entries = await this.entries();
        for (const [key, value] of entries) {
            map.set(key, value);
        }
        map.forEach(callbackfn, thisArg);
    }

    async generateKey(target: Object): Promise<string> {
        const str = JSON.stringify(target, Object.keys(target).sort());

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}
