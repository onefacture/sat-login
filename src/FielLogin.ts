import * as unirest           from 'unirest';
import * as cheerio           from 'cheerio';
import { X509, generaFirma }  from 'sat-x509';
import Base64                 from './Base64';
import { Headers }            from './Headers';
import URLS                   from './URLS';
import { AbstractLogin }      from './AbstractLogin';
import SATLoginError          from './SATLoginError';

export class FielLogin extends AbstractLogin {

    private inputs;
    private tokenuuid;
    private certificate;
    private privateKey;
    private certX509;
    private errorLoadCertificate = 'Es necesario cargar el certificado';

    constructor() {
        super();

        this.certX509 = new X509();
    }

    public init() {
        let __self__ = this;
        return new Promise((resolve, reject) => {
            unirest
            .post(URLS.SAT_FIEL_LOGIN)
            .headers(Headers.post(URLS.SAT_HOST_CFDI_AUTH, URLS.SAT_FIEL_LOGIN))
            .jar(this.cookieJar)
            .timeout(60000)
            .strictSSL(false)
            .end((response) => {
                if(response.error) {
                    response.error.customMessage = SATLoginError.getMessageError(response.error);
                    reject(response.error);
                } else {
                    let $ = cheerio.load(response.body);
                    let inputs = $('#certform input');
                    let json;
                    __self__.inputs = {};
                    for(let i = 0; i < inputs.length; i++) {
                        json = {
                            name:  inputs[i].attribs.name,
                            id:    inputs[i].attribs.id,
                            value: inputs[i].attribs.value ? inputs[i].attribs.value : '',
                        };

                        if(json.name && json.id != 'tokenuuid') {
                            __self__.inputs[json.name] = json.value;
                        } else if (json.id == 'tokenuuid') {
                            __self__.tokenuuid = json.value;
                        }
                    }

                    resolve();
                }
            });
        });
    }

    public run(params: any) {
        let __self__ = this;
        return new Promise((resolve, reject) => {
            this.inputs.token = this.getToken(params);
            unirest
            .post(URLS.SAT_FIEL_LOGIN)
            .send(this.inputs)
            .headers(Headers.post(URLS.SAT_HOST_CFDI_AUTH, URLS.SAT_FIEL_LOGIN))
            .jar(this.cookieJar)
            .timeout(60000 * 3)
            .strictSSL(false)
            .end((response) => {
                if(response.error) {
                    response.error.customMessage = SATLoginError.getMessageError(response.error);
                    reject(response.error);
                } else {
                    unirest
                    .get(URLS.SAT_URL_PORTAL_CFDI)
                    .headers(response.headers)
                    .jar(__self__.cookieJar)
                    .end((response) => {
                        let objects = __self__.genericResponsePromise({
                            response:   response,
                        })
                        if(!objects || (objects && !objects.success)) { return reject(); }

                        __self__.postDataAuth(objects).then((response) => {
                            __self__.start(response).then(resolve).catch(reject);
                            // __self__.start(response).then((response) => {
                            //     __self__.checkSuccessAuthentication(response)
                            //     .then(resolve).catch(reject);
                            // });
                         });
                     });
                }

            });
        });
    }

    public getCertificate() {
        return this.certificate;
    }

    public getPrivateKey() {
        return this.privateKey;
    }

    public getRFC() {
        if(!this.certificate) { throw this.errorLoadCertificate; }

        return this.certX509.getRFC();
    }

    public getNumSerie() {
        if(!this.certificate) { throw this.errorLoadCertificate; }

        return this.certX509.getNumSerie();
    }

    public getNotBefore() {
        if(!this.certificate) { throw this.errorLoadCertificate; }

        return this.getFormatDate(this.certX509.getNotBefore());
    }

    public getNotAfter() {
        if(!this.certificate) { throw this.errorLoadCertificate; }

        return this.getFormatDate(this.certX509.getNotAfter());
    }

    private getFormatDate(dateStr) {
        let date = dateStr.slice(0, -1);
        if(date.length == 12) {
            let arrayPositions = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
            let jsonDate: any  = {}, i, j = 0;
            for(i = 0; i < arrayPositions.length; i ++) {
                jsonDate[arrayPositions[i]] = date.slice(j, j += 2);
            }

            return new Date(parseInt(jsonDate.year) + 2000, jsonDate.month, jsonDate.day, jsonDate.hours, jsonDate.minutes, jsonDate.seconds);
        } else {
            return 'No se pudo obtener la fecha';
        }
    }

    private getToken(params: { password }) {
        let token;
        try {
            let rfc      = this.getRFC();
            let numSerie = this.getNumSerie();
            let co       = `${this.tokenuuid}|${rfc}|${numSerie}`;
            let firma    = generaFirma(params.password, co, this.certificate, this.privateKey);
            if(firma != 'SIN_FIRMA') {
                token = Base64.encode(`${Base64.encode(co)}#${firma}`);
            }

            return token;
        } catch(e) {
            throw {
                customMessage: 'Certificado, clave privada o contraseña de clave privada inválidos, verifique sus datos e intente nuevamente.',
            };
        }
    }

    public initCert(certificate) {
        this.certificate = certificate;
        this.certX509.readCertPEM(this.certificate);
        this.inputs.fert = this.certX509.getNotAfter();
    }

    public initPrivateKey(privateKey) {
        this.privateKey = privateKey;
    }

}
