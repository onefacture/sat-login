import * as unirest     from 'unirest';
import * as cheerio     from 'cheerio';
import { Headers }      from './Headers';
import URLS             from './URLS';
import SATLoginError    from './SATLoginError';

export abstract class AbstractLogin {

    protected  rfc:         string;
    protected  password:    string;
    protected  cookieJar:   unirest.jar;
    protected  timerInterval;

    constructor() {
        this.initCookieJar();
    }

    protected initCookieJar() {
        this.cookieJar  = unirest.jar();
    }

    public getCookieJar() {
        return this.cookieJar;
    }

    public abstract run(params: any);

    // Este método no es lo suficientemente seguro... Hay que editar y asegurarse del éxito
    public runLoginPacSat() {
        let __self__ = this, $, $form, inputs;
        return new Promise((resolve, reject) => {
            unirest
            .post(URLS.SAT_URL_PAC_SAT)
            .jar(this.cookieJar)
            .timeout(60000 * 3)
            .strictSSL(false)
            .end((response) => {
                $ = cheerio.load(response.body);
                $form  = $('form');
                inputs = $form.serializeArray()
                .reduce((prev, next) => Object.assign(prev, { [next.name]: next.value }), {});

                unirest
                .post($form[0].attribs.action)
                .send(inputs)
                .jar(this.cookieJar)
                .end(resolve);
            });
        });
    }

    protected postDataAuth(params: {inputValues}) {
        let __self__ = this;

        return new Promise((resolve, reject) => {
            if(!params.inputValues) { return reject(); }
            unirest
            .post(URLS.SAT_URL_PORTAL_CFDI)
            .send(params.inputValues)
            .followAllRedirects(true)
            .strictSSL(false)
            .jar(__self__.cookieJar)
            .end((response) => {
                resolve(__self__.genericResponsePromise({
                    response:   response,
                }));
            });
        });
    }

    protected start(params: {inputValues}) {
        let __self__ = this;
        return new Promise((resolve, reject) => {
            unirest
            .post(URLS.SAT_URL_PORTAL_CFDI)
            .send(params.inputValues)
            .followAllRedirects(true)
            .strictSSL(false)
            .jar(__self__.cookieJar)
            .end((response) => {
                resolve(__self__.genericResponsePromise({
                    response:   response,
                }));
            });
        });
    }

    protected checkSuccessAuthentication(response) {
        let __self__ = this;
        return new Promise((resolve, reject) => {
            unirest.get(URLS.SAT_VERIFY_LOGIN)
            .strictSSL(false)
            .followAllRedirects(true)
            .jar(__self__.cookieJar)
            .end((response) => {
                if(response.body.indexOf('Select an authentication card.') >= 0) {
                    return reject(true);
                } else {
                    return resolve();
                }
            });
        });
    }

    protected genericResponsePromise(params) {
        if(params.response && params.response.body) {
            let $ = cheerio.load(params.response.body);
            let form = $('form');
            let arr  = form.serializeArray();
             return {
                success:      arr.length > 0,
                inputValues:  arr && arr.length ? this.parseInputFormat(arr) : []
            };
        }
        
        return null;
    }

    protected parseInputFormat(serializedArray) {
        return serializedArray.map((input) => {
          let o = {};
          o[input.name] = input.value;
          return o;
        }).reduce(function(a, b) {
          return (<any>Object).assign(a, b);
        });
    }

    protected logout() {
        let __self__ = this;
        __self__.stopIntervalKeepSession();
        return new Promise((resolve, reject) => {
            unirest.get(URLS.SAT_LOGOUT)
            .jar(__self__.cookieJar)
            .end((response) => {
                __self__.initCookieJar();
                if(response.error) {
                    response.error.customMessage = SATLoginError.getMessageError(response.error);
                    reject(response.error);
                } else {
                    resolve();
                }
            });
        });
    }

    protected initIntervalKeepSession() {
        let __self__ = this;
        this.timerInterval = setInterval(() => {
            unirest.get(URLS.SAT_MANTIENE_SESSION)
            .jar(__self__.cookieJar)
            .end((response) => {
                if(response.code != 200) {
                    __self__.stopIntervalKeepSession();
                } else {
                    console.info('Manteniendo session...');
                }
            });

        }, 240000);
    }

    protected stopIntervalKeepSession() {
        clearInterval(this.timerInterval);
    }

}
