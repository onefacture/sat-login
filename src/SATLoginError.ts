export class SATLoginError {
	public static ERRORS = {
        DEFAULT:   'Parece que el portal del SAT está teniedo problemas, vuelva a intentar más tarde',
        ETIMEDOUT: 'No se recibió respuesta del SAT(Vuelva a intentar más tarde...)',
        ENOTFOUND: 'No se recibió respuesta del SAT (revisa tu conexión a internet)',
        ERR500:    'Error 500: El portal del SAT está teniendo intermintencias',
        CODE:      (errorCode) => {
            return `Error del SAT(${errorCode}): Vuelva a intentar más tarde...`;
        },
    };

    public static getMessageError(error) {
        let message = SATLoginError.ERRORS.DEFAULT;

        if(error.code == 'ETIMEDOUT') {
            message = SATLoginError.ERRORS.ETIMEDOUT;
        } else if(
            error.code == 'ENOTFOUND' ||
            error.code == 'ENOENT'
            ) {
            message = SATLoginError.ERRORS.ENOTFOUND;
        } else if(error.status === 500) {
            message = SATLoginError.ERRORS.ERR500;
        } else if(error.code) {
            message = SATLoginError.ERRORS.CODE(error.code);
        }

        return message;
    }
}
