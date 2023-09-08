// import reqmate from ".";

// reqmate.get('https://jsonplaceholder.typicode.com/todos/1').sendRequest().then(res => {
//     console.log(res);
// })



const private_parsers = {
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
}
