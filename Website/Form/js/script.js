async function iataGET(cityName) {

    var endpoint = 'https://api.tequila.kiwi.com/locations/query?'
    var params = 'locale=en-US&location_types=airport&limit=8&active_only=true&term=' + cityName;
    var url = endpoint + params;
    var headerData = {
        'apikey': 'OL_rv10MTqCcfcWJ6rXEPg7Qst-JXODA',
        'accept': 'application/json',
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: headerData,
    });
    const jsonResponse = await response.json();
    if (jsonResponse['locations'].length === 0) {
        console.log(response.status);
        console.log(response.statusText);
        console.log('NO DATA FOUND FOR : ' + cityName);
        return false;
    }
    else {
        return jsonResponse;
    }
}

function filterCode(data, country) {
    let locations = data['locations'];
    var locData = false;

    try {
        for (let locIdx in locations) {
            let loc = locations[locIdx];
            if (country == String(loc['city']['country']['name']).toLowerCase()) {
                locData = {
                    id: loc['id'],
                    airport_name: loc['name'],
                    city_id: loc['city']['id'],
                    city_name: loc['city']['name'],
                    country_id: loc['city']['country']['id'],
                    country_name: loc['city']['country']['name'].toLowerCase(),
                    region_id: loc['city']['region']['id'],
                    region_name: loc['city']['region']['name'],
                }
            }
        }
    } catch (error) {
        console.log(error);
        // HANDLE IT LATER
    }
    return locData;
}

async function getFlightDetails(link) {
    const response = await fetch(link, {
        method: "GET",
        headers: {
            'apikey': 'OL_rv10MTqCcfcWJ6rXEPg7Qst-JXODA',
            'accept': 'application/json',
        }
    });

    const jsonResponse = await response.json();
    if (jsonResponse['data'].length === 0) {
        console.log('NO FLIGHTS FOUND');
        return -1;
    } else {
        // console.log(jsonResponse['data']);
        return jsonResponse['data'];
    }
}

function filterDealData(allDeals) {

    var allDetails = [];
    for (let deal of allDeals) {
        var details = {
            'airlines': deal['airlines'],
            'seats_availability': deal['availability']['seats'] !== null ? deal['availability']['seats'] : 0,
            'cityCodeFrom': deal['cityCodeFrom'],
            'cityFrom': deal['cityFrom'],
            'cityCodeTo': deal['cityCodeTo'],
            'cityTo': deal['cityTo'],
            'countryFromCode': deal['countryFrom']['code'],
            'countryFromName': deal['countryFrom']['name'],
            'countryToCode': deal['countryTo']['code'],
            'countryToName': deal['countryTo']['name'],
            'fare': deal['fare'],
            'link': deal['deep_link'],
            'duration': deal['duration'],
            'facilitated_booking_available': deal['facilitated_booking_available'],
            'local_arrival': deal['local_arrival'],
            'local_departure': deal['local_departure'],
        }

        allDetails.push(JSON.stringify(details));
        // console.log(JSON.stringify(details));
    }

    return allDetails;
}



const iataForm = document.getElementById('iata-submit');
if (iataForm) {
    iataForm.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('SUBMIT BUTTON CLICKED');

        var locData = [];
        var somethingWrong = false;

        const cityFrom = document.querySelector('#cityFrom').value;
        const countryFrom = document.querySelector('#countryFrom').value.toLowerCase();
        const cityTo = document.querySelector('#cityTo').value;
        const countryTo = document.querySelector('#countryTo').value.toLowerCase();

        var cities = [cityFrom, cityTo];
        var countries = [countryFrom, countryTo];

        for (let idx in cities) {
            var data = await iataGET(cities[idx]);
            if (data != false) {
                var locObj = filterCode(data, countries[idx]);
                if (locObj === false) {
                    somethingWrong = true;
                    break;
                }
                else
                    locData.push(locObj);
            } else {
                somethingWrong = true;
                break;
            }
        }

        if (somethingWrong === true) {
            console.log('INVALID DATA PROVIDED, PLEASE TRY AGAIN');
            locData = [];
            return;
        }

        localStorage.setItem('flyFromIATA', locData[0]['id']);
        localStorage.setItem('flyToIATA', locData[1]['id']);
        window.location.href = './flightDetails.html';
    });
}


const flightDetails = document.getElementById('final-submit');
if (flightDetails) {
    flightDetails.addEventListener('click', async (e) => {
        e.preventDefault();

        const dateFrom = document.querySelector('#fromDate').value;
        const dateTo = document.querySelector('#toDate').value;
        const flightType = document.querySelector('input[name="flightType"]:checked').value;
        const stopOverType = document.querySelector('input[name="stopOverType"]:checked').value;
        const currencyType = document.querySelector('#currencyType').value;
        const priceRange = document.querySelector('#priceRange').value;
        const cabinType = document.querySelector('#cabinType').value;
        const flyFrom = localStorage.getItem('flyFromIATA')
        const flyTo = localStorage.getItem('flyToIATA')

        var url = `https://api.tequila.kiwi.com/v2/search?curr=${currencyType}&date_from=${dateFrom}&date_to=${dateTo}&fly_from=${flyFrom}&fly_to=${flyTo}&limit=7&locale=en-US&max_stopovers=${stopOverType}&price_to=${priceRange}&selected_cabins=${cabinType}`;


        if (flightType === 'round') {
            url += `&return_from=${dateFrom}&return_to=${dateTo}`
        }

        var dealData = await getFlightDetails(url);
        if (dealData !== -1) {
            var finalDeals = filterDealData(dealData);
            var seven_deals = {
                "deals": finalDeals,
            };

            var seven_deals_str = (JSON.stringify(seven_deals));
            localStorage.setItem('sevenDeals', seven_deals_str);
            window.location.href = '../../Website/dealTable.html';
        }
    });
}
