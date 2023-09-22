const fs = require('fs').promises;
const { Polling, Timed } = require('reqmate');

async function readFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data;
    } catch (error) {
        throw new Error(`Could not read the file: ${error.message}`);
    }
}


async function writeFile(filePath, data) {
    try {
        await fs.writeFile(filePath, data, 'utf8');
        console.log('Data successfully written to file.');
    } catch (error) {
        throw new Error(`Could not write to the file: ${error.message}`);
    }
}


async function readTimed() {

    (new Polling())
        .setCallback(() => readFile('file.txt'))
        .onResponse((r, done) => {
            console.log("READING: ", r)

            if (r === "3") done();
        })
        .execute();

}

async function writeTimed() {
    console.log("RUNNING")
    let counter = 0;
    const timed = new Timed();
    timed.setInterval(1000)
        .setTimeout(5000)
        .setCallback(() => {
            counter++;
            writeFile('file.txt', `${counter}`)
        })
        .execute();
}

readTimed();
writeTimed();

