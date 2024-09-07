import { Schema, Document, model } from "mongoose";
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');


export const Audience = {
    VENDOR: 'Vendor',
    CUSTOMERS: 'Customers',
    DRIVERS: 'Drivers',
}

export const NotificationStatus = {
    SENT: 'Sent',
    DRAFT: 'Draft',
}

interface UsersItem {
    user_id: string;
    title: string;
    ar_title: string;
    message: string;
    ar_message: string;
    is_read: boolean;
    is_delete: boolean;
    data: object
}

interface INotification extends Document {
    title: string;
    ar_title: string;
    message: string;
    ar_message: string;
    audience: string;
    // start_date: string;
    send_by: string;
    country_id: string;
    city_id: string;
    is_send: boolean;
    is_delete: boolean;
    users: UsersItem[];
}

const NotificationUserSchema = new Schema<UsersItem>({
    user_id: { type: String },
    text: { type: String },
    message: { type: String },
    is_read: { type: Boolean },
    is_delete: { type: Boolean, default: false },
    data: { type: Object, default: null }
});

const NotificationSchema = new Schema<INotification>({
    title: { type: String, default: null },
    ar_title: { type: String, default: null },
    message: { type: String, default: null },
    ar_message: { type: String, default: null },
    send_by: { type: String, default: null },
    country_id: { type: Schema.Types.ObjectId, ref: "Country", default: null, },
    city_id: { type: Schema.Types.ObjectId, ref: "City", default: null, },
    audience: { type: String, default: null },
    Schedule_time : { type: Date, default: Date.now },
    is_send: { type: Boolean, default: false },
    is_delete: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.SENT },
    users: [NotificationUserSchema],
      
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

NotificationSchema.plugin(aggregatePaginate);

const Notification = model<INotification>("Notification", NotificationSchema);

export default Notification;
