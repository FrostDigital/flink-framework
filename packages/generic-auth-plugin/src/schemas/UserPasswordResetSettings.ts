export interface UserPasswordResetSettings{
    email : {
        from_address : string,
        subject : string, 
        html : string,
    },
    code : {
        numberOfDigits : number,
        lifeTime : string,
        jwtSecret : string
    }
}