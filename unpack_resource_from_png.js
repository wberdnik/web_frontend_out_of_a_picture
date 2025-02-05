// @author <wberdnik.gmail.com>

const URL_png = 'your url';
// position of your resource in the picture
const left = 5, top = 5, right = 590, bottom = 70;


function fromPng(buffer) {
    
    const ff = 256, u8toA = x => new Uint8Array(x);
    
    let x = new DataView(buffer),
        ex = x.getUint8.bind(x),        
        len = ((ex(4) * ff + ex(2)) * ff + ex(1)) * ff + ex(0),
        arr = u8toA(len);

    for (let i = 5, j = 0; j < len; i++)
        if ((i & 3) !== 3) { // skip a transparent byte
            arr[j] = ex(i);
            j++;
        }
    return arr.buffer
}

async function go() {
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.style.display = "none";

    img.src = URL_png;

    const canv = window.document.createElement('canvas');

    // size of picture
    canv.height = 800;
    canv.width = 600;
    const ctx = canv.getContext("2d");

    await (new Promise((r, _) => img.addEventListener("load", r)));

    ctx.drawImage(img, 0, 0);

    const bufferRecord = fromPng(
        ctx.getImageData(left, top, right, bottom).data.buffer
    )

    const decoder = new TextDecoder('utf-8', {ignoreBOM: !0, fatal: !0});

    YOUR_RESOURCE = decoder.decode(new Uint8Array(bufferRecord))
}

go()   
