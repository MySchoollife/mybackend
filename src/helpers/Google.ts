import axios from "axios";

const TravelMode = {
    Driving: 'driving',
    Transit: 'transit'
}

const apiKey = "AIzaSyCrfZW4Yn9i6Fk9zq_YEsCwW-sbdXyVCzs" //"AIzaSyAz3PprwaKTQW55OcKOgoW8v_8QqO3w6S8"; //'AIzaSyCrfZW4Yn9i6Fk9zq_YEsCwW-sbdXyVCzs

class Google {
    constructor() { }

    async calculateTravelTime({ source, destination, travelMode = TravelMode.Driving }): Promise<any> {
        try {
            const mode = travelMode || "driving";
            const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${source}&destinations=${destination}&mode=${mode}&key=${apiKey}`;

            let response = await axios.get(apiUrl);
            console.log(response, "response" ,apiUrl);

            const { rows } = response.data;

            console.log(JSON.stringify(rows), "rows");

            const elements = rows[0]?.elements;

            if (!elements || elements.length === 0) {
                console.log("No elements found in the response.");
                return {};
            }

            const { duration: Gduration, distance: Gdistance } = elements[0];

            const duration = {
                text: Gduration?.text,
                in_hours: Gduration?.value / 3600,
                in_sec: Gduration?.value,
            };

            const distance = {
                text: Gdistance?.text,
                in_meters: Gdistance?.value,
                in_km: Gdistance?.value ? Gdistance?.value / 1000 : 0,
                in_mile: Gdistance?.value ? Math.round(((Gdistance?.value / 1000) / 1.60934) * 100) / 100 : 0
            };

            console.log(duration ,distance ,"Google");
            
            return { duration, distance };

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    async getAddressDetails(lat, long) {
        // console.log(lat, long, "hfjdhjhjdgh------------------- latlng");
        try {

            const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=AIzaSyAad0w-9p1zROAeni2JakxvkSfX_YDIkF4`;

            let response: any = await axios.get(apiUrl);

            const postalCodeObj = response?.data?.results[0]?.address_components.find(component => component.types.includes('postal_code'));
            const postalCode = postalCodeObj ? postalCodeObj.long_name : null;

            const countryObj = response?.data?.results[0]?.address_components.find(component => component.types.includes('country'));
            const country = countryObj ? countryObj.short_name : null;

            return {
                country,
                postalCode
            };
        } catch (err) {
            console.log(err);
            return {};
        }
    }

    async getCoordinatesFromZipCode(zipCode) {
        try {

            const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${apiKey}`;

            const response = await axios.get(geocodingUrl);
            const location = response.data.results[0].geometry.location;

            return location;
        } catch (error) {
            console.error('Error fetching coordinates:', error.message);
            throw error;
        }
    }


}

export default new Google();