export default interface ReqMateCache {
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
