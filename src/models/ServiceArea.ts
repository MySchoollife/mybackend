import * as mongoose from 'mongoose';
import { model, AggregatePaginateModel } from 'mongoose';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema;

const ServiceArea = new Schema(
    {
        name: { type: String, default: null,},
        ar_name: { type: String, default: null,},
        country_id: { type: Schema.Types.ObjectId, ref: 'ServiceCountry' },
        city_id: { type: Schema.Types.ObjectId, ref: 'ServiceCity' },
        is_active: {
            type: Boolean,
            default: true,
        },
    }, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
ServiceArea.index({ name: "text" });

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("ServiceArea", ServiceArea);