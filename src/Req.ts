import mapCache, { MapCache } from "./cache/MapCache";
import Retry from "./retry/base/Retry";
import RetryFactory, { RetryTypes } from "./retry/RetryFactory";

type Res<T> = {
    data: T,
    ok: Boolean,
    status: number,
    headers: Record<string, string>,
    cached?: boolean,
    cacheKey?: string,
}

type ReqConfig = {
    mode: "cors" | "no-cors" | "same-origin" | "navigate" | undefined,
    credentials: "omit" | "same-origin" | "include" | undefined,
    cache: "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached" | undefined,
    redirect: "follow" | "error" | "manual" | undefined,
}


export default class Req {
    private _headers: Record<string, string> = {};

    private reqConfig: ReqConfig = {
        mode: undefined,
        credentials: undefined,
        cache: undefined,
        redirect: undefined,
    }

    private _retry: Retry | undefined = undefined;

    private _timeout: number = 0;

    private _willCache: boolean = false;
    private _cacheTTL: number = 0;

    private _requestKey: string;

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
        private readonly _method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
        private readonly _url: string,
        private readonly _body: BodyInit | Object | undefined = undefined
    ) {
        this._requestKey = MapCache.generateKey({ url: _url, method: _method, body: _body });
        this._headers['Content-Type'] = 'application/json';
    }


    public async send<T>(): Promise<Res<T>> {
        if (mapCache.has(this._requestKey)) {
            return this.getResultFromCache<T>()!;
        }

        const result = this._retry ? await this.getResultFromRetrier<T>() : await this.getResultFromFetch<T>();
        this._willCache && mapCache.set(this._requestKey, result, this._cacheTTL);

        return result;
    }


    private getResultFromCache<T>(): Res<T> {
        const result = mapCache.get(this._requestKey) as Res<T>;
        result.cached = true;
        result.cacheKey = this._requestKey;
        return result;
    }

    private async getResultFromRetrier<T>(): Promise<Res<T>> {
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
        return await this._retry!.setCallback(callback.bind(this)).execute() as Res<T>;
    }

    private async getResultFromFetch<T>(): Promise<Res<T>> {
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
        const parser = this.getRequestParser(res) || this._parsers['application/json'];

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


    public setConfig(config: Partial<ReqConfig>): Req {
        Object.assign(this.reqConfig, config);
        return this;
    }
};


