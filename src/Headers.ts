export class Headers {

    public static post(host: string, referer: string) {
        return {
            'Accept':             'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding':    'gzip, deflate',
            'Connection':         'keep-alive',
            'Host':               host,
            'Referer':            referer,
            'User-Agent':         'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'Content-Type':       'application/x-www-form-urlencoded',
            'cache-control':      'max-age=0'
        };
    }

    public static postAjax(host: string, referer: string) {
        return (<any>Object).assign(Headers.post(host, referer), {
            'X-MicrosoftAjax':    'Delta=true',
            'x-requested-with':   'XMLHttpRequest',
            'Pragma':             'no-cache'
        });
    }

}
