import * as mongoose from 'mongoose';
import { model, AggregatePaginateModel } from 'mongoose';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema;

const NotificationType = {
    "REMINDER" : "Reminder",
    "WEEKLY_HEALTH_TIP" : "Weekly_Health_tip",
 
}

const NotificationUserSchema = new Schema(
    {
        to_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        from_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            default: null,
        },
        description: {
            type: String,
            default: null,
        },
        type: { type: String, enum: Object.values(NotificationType), default: NotificationType.REMINDER,},
        data: {
            type: Object,
            default: null,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    });

NotificationUserSchema.plugin(aggregatePaginate);

const NotificationUser = model<any, AggregatePaginateModel<any>>("NotificationUser", NotificationUserSchema);

export default NotificationUser;