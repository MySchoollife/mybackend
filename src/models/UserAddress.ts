import * as mongoose from 'mongoose';
import { model, AggregatePaginateModel } from 'mongoose';
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const Schema = mongoose.Schema;

const UserAddressSchema = new Schema(
    {
        customer_id: { type: Schema.Types.ObjectId, ref: 'User' },
        address: { type: String },
        country_id: { type: Schema.Types.ObjectId, ref: "ServiceCountry", default: null, },
        city_id: { type: Schema.Types.ObjectId, ref: "ServiceCity", default: null, },
        area_id: { type: Schema.Types.ObjectId, ref: "ServiceArea", default: null},
        name: { type: String, default: null },
        landmark: { type: String, default: null, },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        tag: { type: String, default: null, },
        temporary: { type: Boolean, default: false,},
        is_default: { type: Boolean, default: false,},
        is_selected: { type: Boolean, default: false,},
        user_location: {
            type: { type: String },
            coordinates: [Number],
        },
    }, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

    .plugin(aggregatePaginate);

UserAddressSchema.index({ user_location: "2dsphere" });

const UserAddress = model<any, AggregatePaginateModel<any>>("UserAddress", UserAddressSchema);

export default UserAddress;