// Exponential Backoff
// In exponential backoff, the time interval between retry attempts is doubled after each failure, up to a maximum interval or a maximum number of attempts.This approach helps to alleviate the load on the server and is often used in conjunction with a random "jitter" to avoid synchronizing retries from multiple clients.
