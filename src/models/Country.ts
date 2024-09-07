import { Schema, model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require('mongoose-aggregate-paginate-v2'); 

const CountrySchema = new Schema(
    {
        name: {
            type: String,
            default: null,
        }, 
        region: { type: String, default: null,},
        subregion: { type: String, default: null,},
        native: { type: String, default: null,},
        tld: { type: String, default: null,},
        currency_symbol: { type: String, default: null,},
        currency_name: { type: String, default: null,},
        currency: { type: String, default: null,},
        capital: { type: String, default: null,},
        numeric_code: { type: String, default: null,},
        iso2: { type: String, default: null,},
        iso3: { type: String, default: null,},
        emojiU: { type: String, default: null,},
        id:{
            type:Number,
            default:null
        },
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },
        emoji: {
            type: String,
            default: null,
        },
        phone_code: {
            type: String,
            default: true,
        },
        translations: {
            type: Object,
            default: true,
        },
        timezones: {
            type: Object,
            default: true,
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

CountrySchema.plugin(aggregatePaginate);

const Country = model<any, AggregatePaginateModel<any>>("Country", CountrySchema);

export default Country;