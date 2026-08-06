#!/usr/bin/env python3
"""Generate the maskable PWA icon from the existing 512px icon.

Android crops launcher icons to the device's mask shape, so a maskable icon
needs an opaque full-bleed background and its mark kept inside the middle 80%.
The shipped icon has transparent corners and fills the frame, so it would get
clipped. This pads it onto a solid canvas of its own background colour.

Run from the project root:  python3 scripts/make-maskable-icon.py
"""
import zlib
import struct

SRC = 'public/icon-512.png'
DST = 'public/icon-maskable-512.png'
SIZE = 512
# Fraction of the canvas the original icon is scaled down to, leaving padding
# for the mask to eat.
INNER = 0.80


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    pos, idat, pal, trns = 8, b'', None, None
    w = h = ctype = 0
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        if typ == b'IHDR':
            w, h, depth, ctype, _comp, _filt, interlace = struct.unpack('>IIBBBBB', chunk)
            assert depth == 8 and interlace == 0, 'only 8-bit non-interlaced PNGs'
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'PLTE':
            pal = chunk
        elif typ == b'tRNS':
            trns = chunk
        pos += 12 + length

    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(idat)
    stride = w * channels
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if f == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                b = prev[i]
                c = prev[i - channels] if i >= channels else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line

    rgba = bytearray(w * h * 4)
    for i in range(w * h):
        px = out[i * channels:(i + 1) * channels]
        if ctype == 6:
            r, g, b, a = px
        elif ctype == 2:
            r, g, b = px
            a = 255
        elif ctype == 3:
            idx = px[0]
            r, g, b = pal[idx * 3:idx * 3 + 3]
            a = trns[idx] if trns and idx < len(trns) else 255
        elif ctype == 0:
            r = g = b = px[0]
            a = 255
        else:
            r = g = b = px[0]
            a = px[1]
        rgba[i * 4:i * 4 + 4] = bytes((r, g, b, a))
    return w, h, rgba


def write_png(path, size, rgb):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type: none
        raw += rgb[y * size * 3:(y + 1) * size * 3]

    def chunk(typ, payload):
        return (
            struct.pack('>I', len(payload))
            + typ
            + payload
            + struct.pack('>I', zlib.crc32(typ + payload) & 0xFFFFFFFF)
        )

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    open(path, 'wb').write(png)


def main():
    sw, sh, src = read_png(SRC)

    # Background colour sampled from inside the icon's own rounded square.
    bi = ((sh // 8) * sw + (sw // 8)) * 4
    bg = tuple(src[bi:bi + 3])

    inner = int(SIZE * INNER)
    offset = (SIZE - inner) // 2
    canvas = bytearray(bytes(bg) * (SIZE * SIZE))

    for y in range(inner):
        # Box filter: average the source pixels this destination pixel covers.
        y0, y1 = y * sh // inner, max(y * sh // inner + 1, (y + 1) * sh // inner)
        for x in range(inner):
            x0, x1 = x * sw // inner, max(x * sw // inner + 1, (x + 1) * sw // inner)
            r = g = b = a = n = 0
            for sy in range(y0, y1):
                for sx in range(x0, x1):
                    i = (sy * sw + sx) * 4
                    pa = src[i + 3]
                    r += src[i] * pa
                    g += src[i + 1] * pa
                    b += src[i + 2] * pa
                    a += pa
                    n += 1
            if a == 0:
                continue
            sr, sg, sb = r // a, g // a, b // a
            alpha = a / (n * 255)
            di = ((y + offset) * SIZE + (x + offset)) * 3
            canvas[di] = round(sr * alpha + bg[0] * (1 - alpha))
            canvas[di + 1] = round(sg * alpha + bg[1] * (1 - alpha))
            canvas[di + 2] = round(sb * alpha + bg[2] * (1 - alpha))

    write_png(DST, SIZE, canvas)
    print(f'wrote {DST} — {SIZE}x{SIZE}, background rgb{bg}, mark at {int(INNER * 100)}%')


if __name__ == '__main__':
    main()
