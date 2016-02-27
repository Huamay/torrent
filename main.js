/*!
 * Torrent Decoder v0.1.0 (http://huamay.github.io/torrent)
 * Copyright 2016- Huamay
 * Licensed under the MIT license
 */

var BDecoder = function () {
    this.parseNum = function (dataV) {
        var num = '', offset = 0;
        var c = dataV.getUint8(offset);
        while (48 <= c && c < 58) {
            num += String.fromCharCode(c);
            c = dataV.getUint8(++offset);
        }
        return num;
    };
};

BDecoder.prototype.decode = function (string) {
    this.metadata = null;
    this.cursor = 0;
    this.dataView = new DataView(string);
    this.textDecoder = new TextDecoder('utf-8', {fatal: true});

    if (this.dataView.getUint8(0) != 'd'.charCodeAt(0))
        throw {name: 'Exception', message: 'Bencoding Syntax Error'};
    return this.parseObj();
};

BDecoder.prototype.parseObj = function () {
    var dic = {};
    this.cursor += 1
    this.parseItems(dic)
    this.cursor += 1
    return dic;
};

BDecoder.prototype.parseItems = function (dic) {
    while (this.dataView.getUint8(this.cursor) != 'e'.charCodeAt(0)) {
        var key = this.parseKey();
        if (key == 'info') {
            this.metadata = this.cursor;
            dic[key] = this.parseValue();
            this.metadata = this.dataView.buffer.slice(this.metadata, this.cursor);
        } else
            dic[key] = this.parseValue();
    }
};

BDecoder.prototype.parseKey = function () {
    var len = this.parseNum(new DataView(this.dataView.buffer, this.cursor));
    if (len === '')
        throw {name: 'Exception', message: 'Bencoding Key Error'};
    return this.parseStr(len);
};

BDecoder.prototype.parseValue = function () {
    var len = this.parseNum(new DataView(this.dataView.buffer, this.cursor));
    if (len !== '')
        return this.parseStr(len);
    else if (this.dataView.getUint8(this.cursor) == 'd'.charCodeAt(0))
        return this.parseObj();
    else if (this.dataView.getUint8(this.cursor) == 'i'.charCodeAt(0))
        return this.parseInt();
    else if (this.dataView.getUint8(this.cursor) == 'l'.charCodeAt(0))
        return this.parseList();
    else
        throw {name: 'Exception', message: 'Bencoding Value Error'};
};

BDecoder.prototype.parseStr = function (len) {
    if (this.dataView.getUint8(this.cursor + len.length) != ':'.charCodeAt(0))
        throw {name: 'Exception', message: 'Bencoding String Error'};
    var slen = parseInt(len, 10), s;
    this.cursor += len.length + 1;
    try {
        s = this.textDecoder.decode(new DataView(this.dataView.buffer, this.cursor, slen));
    } catch (err) {
        if (err.name == 'TypeError')
            s = this.dataView.buffer.slice(this.cursor, this.cursor + slen);
        else
            throw err;
    }
    this.cursor += slen;
    return s;
};

BDecoder.prototype.parseInt = function () {
    this.cursor++;
    var num = this.parseNum(new DataView(this.dataView.buffer, this.cursor));
    if (num === '')
        throw {name: 'Exception', message: 'Bencoding Integer Error'};
    this.cursor += num.length;
    if (this.dataView.getUint8(this.cursor) != 'e'.charCodeAt(0))
        throw {name: 'Exception', message: 'Bencoding Syntax Error'};
    this.cursor++;
    return parseInt(num);
};

BDecoder.prototype.parseList = function () {
    var li = [];
    this.cursor++;
    while (this.dataView.getUint8(this.cursor) != 'e'.charCodeAt(0))
        li.push(this.parseValue());
    this.cursor++;
    return li;
};

var TorrentViewer = function (rootElem) {
    this.rootElem = rootElem; // All info will be showed in it.
};

TorrentViewer.prototype.toBinaryString = function (bin) {
    var dataV = new DataView(bin), offset = 0, str = '';
    while (offset < dataV.byteLength) {
        var h = dataV.getUint8(offset++).toString(16);
        if (h.length == 1)
            str += '0';
        str += h;
    }
    return str;
};

TorrentViewer.prototype.view = function (torr, utfLabel) {
    this.textDecoder = new TextDecoder(typeof utfLabel !== 'undefined' ? utfLabel : 'utf-8', {fatal: true});
    console.log(this.textDecoder.encoding);
    if (typeof torr === 'object')
        this.viewObj(torr, this.rootElem);
};

TorrentViewer.prototype.viewObj = function (obj, container) {
    var dl = document.createElement('dl');
    for (var key in obj) {
        var label = document.createElement('dt');
        label.innerHTML = '<dfn><b>' + key + '</b></dfn>: ';
        dl.appendChild(label);
        var tag = document.createElement('dd');
        if (key != 'ed2k')
            this.viewValue(obj[key], tag);
        else {
            var ed2k = 'ed2k://|file|', fname = obj['path'][obj['path'].length - 1];
            if (typeof fname === 'string')
                ed2k += fname;
            else
                ed2k += this.textDecoder.decode(new DataView(fname));
            ed2k += '|' + obj['length'] + '|' + this.toBinaryString(obj[key]) + '|/';
            tag.innerHTML = ed2k;
        }
        dl.appendChild(tag);
    }
    container.appendChild(dl);
};

TorrentViewer.prototype.viewValue = function (val, container) {
    if (val instanceof ArrayBuffer) {
        try {
            val = this.textDecoder.decode(new DataView(val));
        } catch (err) {
            if (err.name == 'TypeError')
                val = this.toBinaryString(val);
            else
                throw err;
        } finally {
            container.innerHTML = val;
        }
    }
    else if (Array.isArray(val))
        this.viewArray(val, container);
    else if (typeof val === 'number' || typeof val === 'string')
        container.innerHTML = val;
    else
        this.viewObj(val, container);
};

TorrentViewer.prototype.viewArray = function (arr, container) {
    var dl = document.createElement('dl');
    for (var i in arr) {
        var dt = document.createElement('dt');
        this.viewValue(arr[i], dt);
        dl.appendChild(dt);
    }
    container.appendChild(dl);
};