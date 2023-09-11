
export class NullCache {

    public has(key: string): boolean {
        return false;
    }

    public set(key: string, value: unknown, ttl: number = 0): void {
        return;
    }

    public get(key: string): unknown {
        return undefined;
    }

    public delete(key: string): boolean {
        return false;
    }

    public expire(key: string, ttl: number): void {
        return;
    }

    public clear(): void {
        return;
    }

    public get size(): number {
        return 0;
    }

    public get keys(): IterableIterator<string> {
        return new Map().keys();
    }

    public get values(): IterableIterator<unknown> {
        return new Map().values();
    }

    public entries(): IterableIterator<[string, unknown]> {
        return new Map().entries();
    }

    public forEach(callbackfn: (value: unknown, key: string, map: Map<string, unknown>) => void, thisArg?: unknown): void {
        return;
    }

    static generateKey(target: Object) {
        return '';
    }


}

export default new NullCache();
