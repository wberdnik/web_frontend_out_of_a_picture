// @author <wberdnik@gmail.com>
const { createCanvas } = require('canvas');

// list of resources
const {mapOfVinil} = require('./picture_records');
const fs = require('fs');
const fs_read = require('fs/promises');

//process.env.DEST  - path and name of a out file

let ctx;
// size of picture
const IMG_WIDTH = 600;
const IMG_HEIGHT = 1200;

const toPng = (src, out, start, length) => {
    const s = new DataView(src); let j = start
    for (let i = 0; i < length; i++, j++) {
        if ((j & 3) === 3) {
            out[j] = 255;
            j++;
        } // alfa channel
        out[j] = s.getUint8(i);
    }
    out[j|3] = 255;
}

function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}


async function pipe() {

    const sizeContainer = new Uint32Array(1);

    for (let trace in mapOfVinil) {
        const job = mapOfVinil[trace];
        let b, x;

        switch (job.type){
            case 0: //file
                x = await fs_read.readFile(job.url);
		        b = toArrayBuffer(x);
                console.log('--------------------------------------------------------------------');
                console.log(job.url + '  ::  ' + b.byteLength)

                break;
            case 1: //url
                x = await fetch(process.env.SITE + job.url);
                if (x.status > 299 || x.status < 200){
                    console.log(job.url + '  ERROR '+x.status);
                    process.exit(404)
                }
                b = await x.arrayBuffer();
                console.log('--------------------------------------------------------------------');
                console.log(job.url + '  ::  ' + b.byteLength)
                console.log((new TextDecoder('utf-8',{ignoreBOM:!0,fatal:!0})).decode(b).substring(0,2000));
            break;
        }
        sizeContainer[0] = b.byteLength;

        let chunk = ctx.getImageData(5, job.top, 590, job.height)
        toPng(sizeContainer.buffer, chunk.data, 0, 4)
        toPng(b, chunk.data, 5, b.byteLength)
        ctx.putImageData(chunk, 5, job.top);

        let pic = ctx.getImageData(5, job.top, 590, job.height).data.buffer
        const canLen = Math.floor ((pic.byteLength - 4)*3/4)
        if (b.byteLength > canLen) {
            console.log(job.url + '  TOO SHORT ' + canLen + " < " +  b.byteLength);
            process.exit(33)
        }

    }
}

const canvas = createCanvas(IMG_WIDTH, IMG_HEIGHT);
ctx = canvas.getContext('2d');

ctx.fillStyle = 'red';
ctx.fillRect(0, 0, IMG_WIDTH, IMG_HEIGHT);


pipe().then(
    () =>{
        const out = fs.createWriteStream(process.env.DEST);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        out.on('finish', () => console.log('The PNG file was created. '+process.env.DEST));
    }
);
