import Req from "./Req";
import mapCache, { MapCache, ReqMateCache } from "./Cache";
import Timed from "./retry/Timed";
import Polling from "./retry/Polling";
import RetryFactory from "./retry/RetryFactory";

class ReqMate {
    debug = false;

    _cache: ReqMateCache = mapCache;

    get(url: string) {
        return new Req(this._cache, 'GET', url);
    }

    post(url: string, body: BodyInit | Object) {
        return new Req(this._cache, 'POST', url, body);
    }

    put(url: string, body: BodyInit | Object) {
        return new Req(this._cache, 'PUT', url, body);
    }

    patch(url: string, body: BodyInit | Object) {
        return new Req(this._cache, 'PATCH', url, body);
    }

    delete(url: string) {
        return new Req(this._cache, 'DELETE', url);
    }

    get cache() {
        return this._cache
    }

    set cache(cache: ReqMateCache) {
        this._cache = cache;
    }
}

export { Timed, Polling, ReqMateCache, MapCache, RetryFactory, Req };

export default new ReqMate();
