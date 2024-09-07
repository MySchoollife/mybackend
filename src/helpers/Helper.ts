

import firebaseAdmin from "../config/firebase";
import _RS from "../helpers/ResponseHelper";
import Notification, { NotificationStatus } from "../models/Notification";
import NotificationUser from "../models/NotificationUser";
import User from "../models/User";



interface notificationParamsType {
    type: string; // should be "adminSend" or "activity" 
    to_id: string;
    notification: {
        title: string,
        ar_title: string,
        description: string,
        ar_description: string
    },
    data: any
}

class Helper {
    public adminId = '64c7366ec01fae98da0614b5'

    async generatePassword(length, options) {
        const optionsChars = {
            digits: "1234567890",
            lowercase: "abcdefghijklmnopqrstuvwxyz",
            uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            symbols: "@$!%&"
        }
        const chars = [];
        for (let key in options) {
            if (options.hasOwnProperty(key) && options[key] && optionsChars.hasOwnProperty(key)) {
                chars.push(optionsChars[key]);
            }
        }

        if (!chars.length)
            return '';

        let password = "";

        for (let j = 0; j < chars.length; j++) {
            password += chars[j].charAt(Math.floor(Math.random() * chars[j].length));
        }
        if (length > chars.length) {
            length = length - chars.length;
            for (let i = 0; i < length; i++) {
                const index = Math.floor(Math.random() * chars.length);
                password += chars[index].charAt(Math.floor(Math.random() * chars[index].length));
            }
        }

        return password;

    }

    async generateRandomString(length, options) {
        const optionsChars = {
            digits: "1234567890",
            lowercase: "abcdefghijklmnopqrstuvwxyz",
            uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        }
        const chars = [];
        for (let key in options) {
            if (options.hasOwnProperty(key) && options[key] && optionsChars.hasOwnProperty(key)) {
                chars.push(optionsChars[key]);
            }
        }

        if (!chars.length)
            return '';

        let randomString = "";

        for (let j = 0; j < chars.length; j++) {
            randomString += chars[j].charAt(Math.floor(Math.random() * chars[j].length));
        }
        if (length > chars.length) {
            length = length - chars.length;
            for (let i = 0; i < length; i++) {
                const index = Math.floor(Math.random() * chars.length);
                randomString += chars[index].charAt(Math.floor(Math.random() * chars[index].length));
            }
        }

        return randomString;

    }

    public async generateAlphaString(length: any) {
        var result = [];
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;

        for (var i = 0; i < length; i++) {
            var randomIndex = Math.floor(Math.random() * charactersLength);
            result.push(characters[randomIndex]);
        }

        return result.join('');
    }

    async sendNotificationUser({ to_id, from_id, title, description, data }: any) {
        try {
            const receiver = await User.findById(to_id);

            await new NotificationUser({
                to_id,
                from_id,
                title,
                description,
                data,
            })

            if (receiver && receiver.device_token) {
                const message = {
                    token: receiver.device_token,
                    notifiaction: {
                        title: title,
                        body: description
                    },
                    data
                }

                firebaseAdmin.messaging().send(message).then((response) => {
                    console.log("Notification sent successfully: ", response);
                }).catch((err) => {
                    console.log("Erorr while sending notificaion: ", err);
                    return
                })
            }

        } catch (err) {
            console.log("Erorr notificaion: ", err);
            return err;
        }
    }

    async sendNotification({ type = 'activity', to_id, notification, data }: any) {
        try {

            const receiver = await User.findById(to_id);

            await new Notification({
                ...notification,
                sent_by: type == "activity" ? null : this.adminId,
                is_send: true,
                status: NotificationStatus.SENT,
                users: [{
                    user_id: to_id,
                    text: notification.title,
                    ar_text: notification?.ar_title,
                    message: notification.description,
                    ar_message: notification?.ar_description,
                    is_read: false,
                    is_delete: false,
                    data: data
                }]

            }).save();

            if (receiver && receiver.device_token) {

                const lang = receiver.user_language ?? 'en'
                const message = {
                    notification: lang == 'en' ? { title: notification.title, body: notification.description, } : { title: notification?.ar_title, body: notification?.ar_description, },
                    data: {
                        data: JSON.stringify(data)
                    },
                    token: receiver.device_token,
                };

                firebaseAdmin.messaging().send(message).then((response) => {
                    console.log("Notification sent successfully : ", response);
                }).catch((error) => {
                    console.log(error)
                    return
                });
            }

        } catch (error) {
            console.log('Error while sending notification : ', error);
            return error;
        }
    }

    public async getFileExtension(url: any) {
        // Get the last part of the URL after the last '/'
        const filename = url.substring(url.lastIndexOf('/') + 1);

        // Get the file extension by getting the last part of the filename after the last '.'
        const extension = filename.substring(filename.lastIndexOf('.') + 1);

        return extension;
    };

    public async getYearAndMonth(data) {
        const years = [];
        const months = [];
        data.forEach(obj => {
            const createdAt = new Date(obj.created_at);
            const year = createdAt.getFullYear();
            const month = createdAt.getMonth() + 1;
            if (!years.includes(year)) {
                years.push(year);
            }
            if (!months.includes(month)) {
                months.push(month);
            }
        });

        return { years, months };
    }

    public async sendTwilioWhatsApp({ number, message }: any) {
        console.log("number", number, "message", message)

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        client.messages
            .create({
                from: 'whatsapp:+14155238886',
                body: message,
                // to: `whatsapp:+917339931491`   // +917339931491
                to: `whatsapp:+${number}`   // +917339931491
            })
            .then(message => console.log(message.sid)).catch(err => {
                console.log(err, "otp error");
            })

    }

    public async generateUUID(length: number) {

        var result = [];
        var characters = 'qwertyuioplkjhgfdsazxcvbnmABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            var randomIndex = Math.floor(Math.random() * charactersLength);
            result.push(characters[randomIndex]);
        }
        return result.join('');
    }

}

export default new Helper();
