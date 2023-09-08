import Retry from "./base/Retry";

export default class RetryFactory {


    static build(retry: Retry | Object) {
        if (retry instanceof Retry) {
            return retry;
        }

    }

    /// if object build the appropriate object
    /// throw is possible
}
