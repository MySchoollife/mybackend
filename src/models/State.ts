import * as mongoose from 'mongoose';
import { model, AggregatePaginateModel } from 'mongoose';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema;

const State = new Schema(
  {
    name: {
        type: String,
        default: null,
    },
    country: { type: Schema.Types.ObjectId, ref: 'Country' },
    country_id: {type: Number, default: null,},//  
    id: {type: Number, default: null,},
    country_code: { type: String, default: null,},
    country_name: { type: String, default: null,},
    state_code: { type: String, default: null,},
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
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("State", State);