# SAT Login

Librería para iniciar sesión con el SAT por medio de cookies

## Instalación
```
npm i --save sat-login
```

## Uso
```

const FielLogin         = require('sat-login').FielLogin;
const fielLoginInstance = new FielLogin();
const unirest           = require('unirest'); // Recomendado para las peticiones con cookies
const SAT_URL           = 'https://pacsat.facturaelectronica.sat.gob.mx/';

(async function() {

    try {
        await fielLoginInstance.init();

        fielLoginInstance.initCert('CERT_BASE_64');
        fielLoginInstance.initPrivateKey('PRIVATE_KEY_BASE_64');

        // Requerido: Logueo portalcfdi (consulta XMLs)
        await fielLoginInstance.run({ password: 'PASSWORD' });

        // Opcional:  Logueo pacsat (facturación)
        await fielLoginInstance.runLoginPacSat();


        // Ejemplo de uso después del logueo
        unirest
        .get(SAT_URL)
        // Aquí se utilizan las cookies
        .jar(fielLoginInstance.getCookieJar())
        .end(response => {
            console.log(response.body);
            console.log('Ahora depende de ti. Hazlo con responsabilidad.');
        });

    } catch(error) {
        /**
        *   Normalmente es un error de intermitencia con el SAT
        **/
        console.log('Ocurrió un error (Puedes intentar nuevamente): ', error);
    }

})()


```

### Licencia

MIT
