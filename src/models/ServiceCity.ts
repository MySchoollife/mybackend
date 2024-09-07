import * as mongoose from 'mongoose';
import { model, AggregatePaginateModel } from 'mongoose';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema;

const ServiceCity = new Schema(
    {
        name: {
            type: String,
            default: null,
        },
        ar_name: { type: String, default: null,},
        id: { type: Number, default: null, },
        country: { type: Schema.Types.ObjectId, ref: 'ServiceCountry' },
        city: { type: Schema.Types.ObjectId, ref: 'City' },
        state_id: {
            type: Number,
            default: null,
        },
        state_name: {
            type: String,
            default: null,
        },
        state_code: {
            type: String,
            default: null,
        },
        country_id: {
            type: Number,
            default: null,
        },
        country_code: {
            type: String,
            default: null,
        },
        country_name: {
            type: String,
            default: null,
        },
        latitude: {
            type: String,
            default: null,
        },
        longitude: {
            type: String,
            default: null,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        is_delete: {
            type: Boolean,
            default: true,
        },


    }, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
ServiceCity.index({ name: "text" });
ServiceCity.index({ country: "text" });
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("ServiceCity", ServiceCity);