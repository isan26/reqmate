export class MapCache {


    constructor(private store = new Map()) { }

    public has(key: string): boolean {
        return this.store.has(key);
    }

    public set(key: string, value: unknown, ttl: number = 0): void {
        this.store.set(key, value);
        ttl > 0 && this.expire(key, ttl);
    }

    public get(key: string): unknown {
        return this.store.get(key);
    }

    public delete(key: string): boolean {
        return this.store.delete(key);
    }

    public expire(key: string, ttl: number): void {
        const miliseconds = ttl * 1000;
        setTimeout(() => {
            this.delete(key);
        }, miliseconds);
    }

    public clear(): void {
        this.store.clear();
    }

    public get size(): number {
        return this.store.size;
    }

    public get keys(): IterableIterator<string> {
        return this.store.keys();
    }

    public get values(): IterableIterator<unknown> {
        return this.store.values();
    }

    public entries(): IterableIterator<[string, unknown]> {
        return this.store.entries();
    }

    public forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): void {
        this.store.forEach(callbackfn, thisArg);
    }

    static generateKey(target: Object) {
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
