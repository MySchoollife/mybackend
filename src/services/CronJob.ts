const moment_tz = require('moment-timezone');
const moment = require('moment');
import Helper from "../helpers/Helper";
import { NOTIFICATION } from "../constants/notifications";
import Banner from "../models/Banner";

const _ = require('lodash')

const Months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export class CronJob {

    async expireBanner() {

        try {
            const expireToUpdate = await Banner.find({
                end_date: { $lte: new Date() } // Find expire banner where enddate is less than or equal to current time
            });

            const updatePromises = expireToUpdate.map(async (discount) => {
                const expireBanner = await Banner.findByIdAndUpdate(discount._id, { is_active: false });
                if (!expireBanner) {
                    console.error(`expire Banner with id ${discount._id} not found`);
                } else {
                    console.log(`expire Banner with id ${discount._id} updated successfully`);
                }
            });

            await Promise.all(updatePromises);

        } catch (error) {
            console.error("Error updating discounts:", error);
        }
    }

    async pending() {
    }

    async expireDiscount() {
    }

    async cancelOrder() {
    }

    async sendNotificationToCustomerToConfirm() {
    }
}

let crons = new CronJob()
export default crons;
