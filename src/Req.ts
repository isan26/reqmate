import { ReqMateCache } from "./Cache";
import Retry from "./retry/base/Retry";
import RetryFactory, { RetryTypes } from "./retry/RetryFactory";

type ReqMateResponse<T> = {
    data: T,
    ok: Boolean,
    status: number,
    headers: MapObject,
    cookies: MapObject[],
    cached?: boolean,
    cacheKey?: string,
}

type ReqMateReqConfig = {
    mode: "cors" | "no-cors" | "same-origin" | "navigate" | undefined,
    credentials: "omit" | "same-origin" | "include" | undefined,
    cache: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached" | undefined,
    redirect: "follow" | "error" | "manual" | undefined,
}

type MapObject = Record<string, string>


export default class Req {
    private _headers: MapObject = {};

    private reqConfig: ReqMateReqConfig = {
        mode: undefined,
        credentials: undefined,
        cache: undefined,
        redirect: undefined,
    }

    private _retry: Retry | undefined = undefined;

    private _timeout: number = 0;

    private _willCache: boolean = false;
    private _cacheTTL: number = 0;

    private _requestKey: string = "";

    private _parser: ((req: Response) => Promise<unknown>) | ((req: Response) => unknown) | undefined = undefined;
    private _parsers = {
        'application/json': (req: Response) => req.json(),
        'text/plain': (req: Response) => req.text(),
        'text/html': (req: Response) => req.text(),
        'text/css': (req: Response) => req.text(),
        'text/javascript': (req: Response) => req.text(),
        'text/xml': (req: Response) => req.text(),
        'application/xml': (req: Response) => req.text(),
        'application/rss+xml': (req: Response) => req.text(),
        'application/atom+xml': (req: Response) => req.text(),
        'application/xhtml+xml': (req: Response) => req.text(),
        'image/jpeg': (req: Response) => req.blob(),
        'image/png': (req: Response) => req.blob(),
        'image/gif': (req: Response) => req.blob(),
        'image/bmp': (req: Response) => req.blob(),
        'image/webp': (req: Response) => req.blob(),
        'image/svg+xml': (req: Response) => req.text(),
        'audio/mpeg': (req: Response) => req.blob(),
        'audio/wav': (req: Response) => req.blob(),
        'audio/ogg': (req: Response) => req.blob(),
        'audio/midi': (req: Response) => req.blob(),
        'video/mp4': (req: Response) => req.blob(),
        'video/webm': (req: Response) => req.blob(),
        'video/ogg': (req: Response) => req.blob(),
        'application/zip': (req: Response) => req.blob(),
        'application/pdf': (req: Response) => req.blob(),
        'multipart/form-data': (req: Response) => req.formData(),
        'application/octet-stream': (req: Response) => req.arrayBuffer(),
    } as Record<string, (req: Response) => Promise<unknown>>;

    constructor(
        private readonly _cacheStore: ReqMateCache,
        private readonly _method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
        private readonly _url: string,
        private readonly _body: BodyInit | Object | undefined = undefined,
    ) {
        this._headers['Content-Type'] = 'application/json';
    }


    public async send<T>(): Promise<ReqMateResponse<T>> {
        if (await this.isRequestCached()) {
            return this.getResultFromCache<T>()!;
        }

        const result = this._retry ? await this.getResultFromRetrier<T>() : await this.getResultFromFetch<T>();
        this._willCache && this.storeOnCache<T>(result);

        return result;
    }


    private async isRequestCached(): Promise<boolean> {
        if (await this._cacheStore.size() === 0) return false;

        const key = await this._cacheStore.generateKey({ url: this._url, method: this._method, body: this._body });

        this._requestKey = key;
        return await this._cacheStore.has(key);
    }

    private async storeOnCache<T>(result: ReqMateResponse<T>) {
        if (!this._willCache) return;

        this._requestKey = await this._cacheStore.generateKey({ url: this._url, method: this._method, body: this._body });
        this._cacheStore.set(this._requestKey, result, this._cacheTTL);
    }


    private async getResultFromCache<T>(): Promise<ReqMateResponse<T>> {
        const result = await this._cacheStore.get(this._requestKey) as ReqMateResponse<T>;
        result.cached = true;
        result.cacheKey = this._requestKey;
        return result;
    }

    private async getResultFromRetrier<T>(): Promise<ReqMateResponse<T>> {
        const callback = async () => {
            const res = await this.sendRequest();
            const data = await this.parseResponse(res) as T;
            return this.generateResult(res, data);
        }
        return await this._retry!.setCallback(callback.bind(this)).execute() as ReqMateResponse<T>;
    }

    private async getResultFromFetch<T>(): Promise<ReqMateResponse<T>> {
        const res = await this.sendRequest();
        const data = await this.parseResponse(res) as T;

        return this.generateResult(res, data);
    }

    private generateResult<T>(res: Response, data: T): ReqMateResponse<T> {
        return {
            ok: res.ok,
            status: res.status,
            headers: this.getHeaders(res),
            cookies: this.getCookieHeaders(res),
            cached: false,
            data: data,
        }
    }

    private getCookieHeaders(res: Response): MapObject[] {
        const cookies: MapObject[] = [];
        res.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                const cookie = this.parseCookie(value);
                cookies.push(cookie);
            }
        });

        return cookies;
    }

    private parseCookie(cookie: string): MapObject {
        const cookies: MapObject = {};

        const cookieParts = cookie.split(';');
        cookieParts.forEach(cookiePart => {
            const [key, value] = cookiePart.split('=');
            if (key && value) cookies[key.trim()] = value;
        });

        return cookies;
    }

    private sendRequest(): Promise<Response> {
        return this._timeout > 0 ?
            this.callWithTimeout(fetch(this._url, this.config)) :
            fetch(this._url, this.config);
    }

    private get config(): RequestInit {
        const isValidBodyInit = typeof this._body === 'string' ||
            this._body instanceof Blob ||
            this._body instanceof FormData ||
            this._body instanceof URLSearchParams ||
            this._body instanceof ReadableStream;

        const body = isValidBodyInit ? this._body as BodyInit : JSON.stringify(this._body);

        return {
            method: this._method,
            headers: this._headers,
            body,
            ...this.reqConfig,
        }
    }

    private async callWithTimeout<T>(promise: Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Request timed out'));
            }, this._timeout);

            promise.then((res) => {
                clearTimeout(timer);
                resolve(res);
            }, (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }


    private parseResponse(res: Response): Promise<unknown> | unknown {
        const parser = this.getRequestParser(res) || this._parsers['application/json'];
        if (!parser) throw new Error('No parser found');

        return parser(res);
    }

    private getRequestParser(res: Response) {
        if (this._parser) return this._parser;

        const contentType = res.headers.get('Content-Type') || 'application/json';
        for (const key in this._parsers) {
            if (contentType.includes(key)) {
                return this._parsers[key];
            }
        }

        throw new Error(`No parser found for ${contentType}`);
    }

    private getHeaders(res: Response): MapObject {
        const headers: MapObject = {};
        res.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return headers;
    }

    public setRetry(retry: RetryTypes): Req {
        this._retry = RetryFactory.build(retry);
        return this;
    }

    public setParser(parser: (req: Response) => Promise<unknown> | unknown): Req {
        this._parser = parser;
        return this;
    }


    public setCaching(ttl: number = 0): Req {
        this._willCache = true;
        this._cacheTTL = ttl;

        return this;
    }

    public setTimeout(timeout: number): Req {
        this._timeout = timeout;
        return this;
    }

    public addHeader(key: string, value: string): Req {
        this._headers[key] = value;
        return this;
    }

    public setHeaders(headers: MapObject): Req {
        this._headers = headers;
        return this;
    }


    public setConfig(config: Partial<ReqMateReqConfig>): Req {
        Object.assign(this.reqConfig, config);
        return this;
    }
};


