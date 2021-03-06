/// <reference path="../typings/tsd.d.ts"/>
var Signal = require("./Signal");
var Statictics = require("./Statictics");
var Render = (function () {
    function Render(width, height) {
        this.element = this.cnv = document.createElement("canvas");
        this.cnv.width = width;
        this.cnv.height = height;
        this.ctx = this.cnv.getContext("2d");
    }
    Render.prototype.clear = function () {
        this.cnv.width = this.cnv.width;
    };
    Render.prototype.drawSignal = function (signal, flagX, flagY) {
        if (flagX === void 0) { flagX = false; }
        if (flagY === void 0) { flagY = false; }
        if (flagY) {
            signal = Signal.normalize(signal, 1);
        }
        var zoomX = !flagX ? 1 : this.cnv.width / signal.length;
        var zoomY = !flagY ? 1 : this.cnv.height / Statictics.findMax(signal)[0];
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.cnv.height - signal[0] * zoomY);
        for (var i = 1; i < signal.length; i++) {
            this.ctx.lineTo(zoomX * i, this.cnv.height - signal[i] * zoomY);
        }
        this.ctx.stroke();
    };
    Render.prototype.drawColLine = function (x) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.cnv.height);
        this.ctx.stroke();
    };
    Render.prototype.drawRowLine = function (y) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.cnv.width, y);
        this.ctx.stroke();
    };
    Render.prototype.cross = function (x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + size, y + size);
        this.ctx.lineTo(x - size, y - size);
        this.ctx.moveTo(x - size, y + size);
        this.ctx.lineTo(x + size, y - size);
        this.ctx.stroke();
    };
    Render.prototype.arc = function (x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        this.ctx.stroke();
    };
    Render.prototype.drawSpectrogram = function (spectrogram, max) {
        if (max === void 0) { max = 255; }
        var imgdata = this.ctx.createImageData(spectrogram.length, spectrogram[0].length);
        for (var i = 0; i < spectrogram.length; i++) {
            for (var j = 0; j < spectrogram[i].length; j++) {
                var _a = CanvasRender.hslToRgb(spectrogram[i][j] / max, 0.5, 0.5), r = _a[0], g = _a[1], b = _a[2];
                var _b = [i, imgdata.height - 1 - j], x = _b[0], y = _b[1];
                var index = x + y * imgdata.width;
                imgdata.data[index * 4 + 0] = b | 0;
                imgdata.data[index * 4 + 1] = g | 0;
                imgdata.data[index * 4 + 2] = r | 0; // is this bug?
                imgdata.data[index * 4 + 3] = 255;
            }
        }
        this.ctx.putImageData(imgdata, 0, 0);
    };
    Render.prototype._drawSpectrogram = function (rawdata, sampleRate) {
        var windowsize = Math.pow(2, 8); // spectrgram height
        var slidewidth = Math.pow(2, 5); // spectrgram width rate
        console.log("sampleRate:", sampleRate, "\n", "windowsize:", windowsize, "\n", "slidewidth:", slidewidth, "\n", "windowsize(ms):", windowsize / sampleRate * 1000, "\n", "slidewidth(ms):", slidewidth / sampleRate * 1000, "\n");
        var spectrums = [];
        for (var ptr = 0; ptr + windowsize < rawdata.length; ptr += slidewidth) {
            var buffer = rawdata.subarray(ptr, ptr + windowsize);
            if (buffer.length !== windowsize)
                break;
            var spectrum = Signal.fft(buffer, sampleRate)[2];
            for (var i = 0; i < spectrum.length; i++) {
                spectrum[i] = spectrum[i] * 20000;
            }
            spectrums.push(spectrum);
        }
        console.log("ptr", 0 + "-" + (ptr - 1) + "/" + rawdata.length, "ms", 0 / sampleRate * 1000 + "-" + (ptr - 1) / sampleRate * 1000 + "/" + rawdata.length * 1000 / sampleRate, spectrums.length + "x" + spectrums[0].length);
        this.cnv.width = spectrums.length;
        this.cnv.height = spectrums[0].length;
        this.drawSpectrogram(spectrums);
    };
    return Render;
})();
var CanvasRender;
(function (CanvasRender) {
    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }
    CanvasRender.hue2rgb = hue2rgb;
    function hslToRgb(h, s, l) {
        // h, s, l: 0~1
        h *= 5 / 6;
        if (h < 0) {
            h = 0;
        }
        if (5 / 6 < h) {
            h = 5 / 6;
        }
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [r * 255, g * 255, b * 255];
    }
    CanvasRender.hslToRgb = hslToRgb;
})(CanvasRender || (CanvasRender = {}));
module.exports = Render;
