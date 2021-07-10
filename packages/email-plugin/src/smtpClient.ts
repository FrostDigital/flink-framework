import { email } from "./schemas/email";
import { client } from "./schemas/client";
import nodemailer from "nodemailer";

export interface smtpClientOptions{
    host: string,
    port: number,
    secure: boolean
    auth?: {
      user: string
      pass: string
    },
}


export class smtpClient implements client {
    transporter: nodemailer.Transporter;
    constructor( options : smtpClientOptions){
        this.transporter = nodemailer.createTransport(options);
    }
    async send(email : email){
        try{
            await this.transporter.sendMail(email);
        }catch(ex){
            return false;
        }
        return true;
    }
}