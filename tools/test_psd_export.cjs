// Run with: node --test tools/test_psd_export.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Exercise the public download path and inspect the actual PSD bytes.
// A one-pixel canvas double keeps this regression test dependency-free.
function canvas() {
    let pixel = [0, 0, 0, 0];
    const stack = [];
    const ctx = {
        globalAlpha: 1,
        save() { stack.push(this.globalAlpha); },
        restore() { this.globalAlpha = stack.pop(); },
        drawImage(source) {
            pixel = source.pixel.slice();
            pixel[3] = Math.round(pixel[3] * this.globalAlpha);
        },
        getImageData() { return { data: Uint8ClampedArray.from(pixel) }; }
    };
    return { width: 1, height: 1, getContext() { return ctx; } };
}

for (const [alpha, expected] of [[36, 92], ['36', 92], [0, 0], [100, 255],
    [undefined, 255], ['', 255], ['invalid', 255], [-10, 0], [120, 255]]) {
    test(`PSD preserves opacity for alpha=${JSON.stringify(alpha)}`, async () => {
        let downloaded;
        const layer = {
            type: 'userFile', name: 'Background art', alpha, iNum: 0,
            x: 0, y: 0, width: 1, height: 1, sx: 0, sy: 0, swidth: 1, sheight: 1
        };
        const context = vm.createContext({
            Blob, TextEncoder, console, setTimeout() {},
            URL: { createObjectURL(blob) { downloaded = blob; return 'blob:test'; } },
            aLayers: { art: layer },
            userImageList: [{ pixel: [120, 80, 40, 128] }],
            isLayerEffectivelyVisible() { return true; },
            document: {
                getElementsByClassName() { return [{ id: 'art' }]; },
                getElementById(id) {
                    return id === 'cmcanvas' ? { width: 1, height: 1 } :
                        { setAttribute() {}, click() {} };
                },
                createElement(type) { assert.equal(type, 'canvas'); return canvas(); }
            }
        });
        context.window = context;
        context.alert = message => assert.fail(message);
        for (const file of ['tm_project.js', 'tm_export.js']) {
            vm.runInContext(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), context);
        }
        await context.clickExportPsd();
        const bytes = Buffer.from(await downloaded.arrayBuffer());
        assert.equal(bytes.toString('ascii', 0, 4), '8BPS');
        // Skip the PSD header and variable-length color/resource sections.
        let pos = 26;
        pos += 4 + bytes.readUInt32BE(pos);
        pos += 4 + bytes.readUInt32BE(pos);
        pos += 8; // Layer/mask section length and layer info length.
        assert.equal(bytes.readInt16BE(pos), 1);
        pos += 2 + 16;
        const channels = bytes.readUInt16BE(pos);
        assert.equal(channels, 4);
        pos += 2 + channels * 6;
        assert.equal(bytes.toString('ascii', pos, pos + 8), '8BIMnorm');
        pos += 8;
        assert.equal(bytes[pos], expected, 'editable Photoshop opacity');
        assert.deepEqual([...bytes.subarray(pos + 1, pos + 4)], [0, 0, 0]);
        pos += 4;
        pos += 4 + bytes.readUInt32BE(pos);
        for (const value of [120, 80, 40, 128]) {
            assert.equal(bytes.readUInt16BE(pos), 0, 'raw channel compression');
            assert.equal(bytes[pos + 2], value, 'source color/alpha must not bake in opacity');
            pos += 3;
        }
    });
}
