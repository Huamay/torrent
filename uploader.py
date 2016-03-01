import json
import urllib2 as urllib
from HTMLParser import HTMLParser

class EndParserError(Exception):
    def __init__(self, value):
        self.value = value

class ContentHTMLParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.status = 0

    def handle_link(self, link):
        url = 'https://api.openload.co/1/remotedl/add?login=3bf6721939c8a539&key=KelPfiNg&url='
        url += link
        req = urllib.Request(url)
        j = urllib.urlopen(req).read().decode('utf-8')
        if json.loads(j)['status'] != 200
            print link

    def handle_starttag(self, tag, attrs):
        if self.status == 1 and tag == 'a':
            for attr in attrs:
                if attr[0] == 'href':
                    self.handle_link(attr[1])
                    raise EndParserError(attr[1])
        if tag == 'iframe':
            self.status = 1

    def handle_endtag(self, tag):
        pass

    def handle_data(self, data):
        pass

class IndexHTMLParser(HTMLParser):
    def __init__(self, pgidx):
        HTMLParser.__init__(self)
        self.pgidx = pgidx
        self.status = 0
        self.cnt = 0
        print '#', pgidx

    def handle_link(self, link):
        url = 'http://av99.us/' + link
        req = urllib.Request(url)
        html = urllib.urlopen(req).read().decode('utf-8')
        chp = ContentHTMLParser()
        try:
            chp.feed(html)
        except EndParserError as e:
            self.cnt += 1
            print cnt,

    def handle_starttag(self, tag, attrs):
        if self.status == 1 and tag == 'a':
            for attr in attrs:
                if attr[0] == 'href':
                    self.handle_link(attr[1])
                    break
            self.status = 0
        if len(attrs) == 1 and attrs[0][1] == 'fl':
            self.status = 1

    def handle_endtag(self, tag):
        pass

    def handle_data(self, data):
        pass

if __name__ == '__main__':
    murl = ['http://av99.us/www/2/index', '.html']
    sidx = ''
    cnt = 0
    for idx in range(1, 56):
        if idx > 1:
            sidx = '_' + str(idx)
        url = sidx.join(murl)
        req = urllib.Request(url)
        html = urllib.urlopen(req).read().decode('utf-8')
        ihp = IndexHTMLParser(idx)
        ihp.feed(html)
        cnt += ihp.cnt
        print '(' + cnt + ')'
    print cnt