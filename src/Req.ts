import { ReqMateCache } from "./Cache";
import Retry from "./retry/base/Retry";
import RetryFactory, { RetryTypes } from "./retry/RetryFactory";

type ReqMateResponse<T> = {
    data: T,
    ok: Boolean,
    status: number,
    headers: Record<string, string>,
    cached?: boolean,
    cacheKey?: string,
}

type ReqMateReqConfig = {
    mode: "cors" | "no-cors" | "same-origin" | "navigate" | undefined,
    credentials: "omit" | "same-origin" | "include" | undefined,
    cache: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached" | undefined,
    redirect: "follow" | "error" | "manual" | undefined,
}


export default class Req {
    private _headers: Record<string, string> = {};

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
        'application/json': (res: Response) => res.json(),
        'text/plain': (res: Response) => res.text(),
        'text/html': (res: Response) => res.text(),
        'text/css': (res: Response) => res.text(),
        'text/javascript': (res: Response) => res.text(),
        'text/xml': (res: Response) => res.text(),
        'application/xml': (res: Response) => res.text(),
        'application/rss+xml': (res: Response) => res.text(),
        'application/atom+xml': (res: Response) => res.text(),
        'application/xhtml+xml': (res: Response) => res.text(),
        'image/jpeg': (res: Response) => res.blob(),
        'image/png': (res: Response) => res.blob(),
        'image/gif': (res: Response) => res.blob(),
        'image/bmp': (res: Response) => res.blob(),
        'image/webp': (res: Response) => res.blob(),
        'image/svg+xml': (res: Response) => res.text(),
        'audio/mpeg': (res: Response) => res.blob(),
        'audio/wav': (res: Response) => res.blob(),
        'audio/ogg': (res: Response) => res.blob(),
        'audio/midi': (res: Response) => res.blob(),
        'video/mp4': (res: Response) => res.blob(),
        'video/webm': (res: Response) => res.blob(),
        'video/ogg': (res: Response) => res.blob(),
        'application/zip': (res: Response) => res.blob(),
        'application/pdf': (res: Response) => res.blob(),
        'multipart/form-data': (res: Response) => res.formData(),
        'application/octet-stream': (res: Response) => res.arrayBuffer(),
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
            return {
                ok: res.ok,
                status: res.status,
                headers: this.getHeaders(res),
                cached: false,
                data: data,
            }
        }
        return await this._retry!.setCallback(callback.bind(this)).execute() as ReqMateResponse<T>;
    }

    private async getResultFromFetch<T>(): Promise<ReqMateResponse<T>> {
        const res = await this.sendRequest();
        const data = await this.parseResponse(res) as T;

        return {
            ok: res.ok,
            status: res.status,
            headers: this.getHeaders(res),
            cached: false,
            data: data,
        }
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
        const parser = this.getRequestParser(res);

        return parser && parser(res);
    }

    private getRequestParser(res: Response) {
        if (this._parser) return this._parser;

        const contentType = res.headers.get('Content-Type') || 'application/json';
        for (const key in this._parsers) {
            if (contentType.includes(key)) {
                return this._parsers[key];
            }
        }

        console.warn(`No parser found for content type: ${contentType}`);
        return this._parsers['application/json'];
    }

    private getHeaders(res: Response): Record<string, string> {
        const headers: Record<string, string> = {};
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

    public setHeaders(headers: Record<string, string>): Req {
        this._headers = headers;
        return this;
    }


    public setConfig(config: Partial<ReqMateReqConfig>): Req {
        Object.assign(this.reqConfig, config);
        return this;
    }
};


