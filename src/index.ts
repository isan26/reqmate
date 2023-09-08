import Req from "./Req";
import cache from "./MapCache";

class ReqMate {
    debug = false;

    get(url: string) {
        return new Req('GET', url);
    }

    post(url: string, body: BodyInit) {
        return new Req('POST', url, body);
    }

    put(url: string, body: BodyInit) {
        return new Req('PUT', url, body);
    }

    patch(url: string, body: BodyInit) {
        return new Req('PATCH', url, body);
    }

    delete(url: string) {
        return new Req('DELETE', url);
    }

    get cache() {
        return cache
    }
}


export default new ReqMate();
