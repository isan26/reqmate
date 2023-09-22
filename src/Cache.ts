export interface ReqMateCache {
    has(key: string): Promise<boolean>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<boolean>;
    expire(key: string, ttl: number): void;
    clear(): Promise<void>;
    size(): Promise<number>;
    keys(): Promise<IterableIterator<string>>;
    values(): Promise<IterableIterator<unknown>>;
    entries(): Promise<IterableIterator<[string, unknown]>>;
    forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): Promise<void>;
    generateKey(data: unknown): Promise<string>;
}


export class MapCache implements ReqMateCache {
    private store: Map<string, unknown>;

    constructor() {
        this.store = new Map<string, unknown>();
    }

    async has(key: string): Promise<boolean> {
        return this.store.has(key);
    }

    async set(key: string, value: unknown, ttl: number = 0): Promise<void> {
        this.store.set(key, value);
        (ttl > 0) && this.expire(key, ttl);
    }

    async get(key: string): Promise<unknown> {
        return this.store.get(key);
    }

    async delete(key: string): Promise<boolean> {
        return this.store.delete(key);
    }

    async expire(key: string, ttl: number): Promise<void> {
        setTimeout(() => {
            this.delete(key);
        }, ttl);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    async size(): Promise<number> {
        return this.store.size;
    }

    async keys(): Promise<IterableIterator<string>> {
        return this.store.keys();
    }

    async values(): Promise<IterableIterator<unknown>> {
        return this.store.values();
    }

    async entries(): Promise<IterableIterator<[string, unknown]>> {
        return this.store.entries();
    }

    async forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): Promise<void> {
        this.store.forEach(callbackfn, thisArg);
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

export default new MapCache();
