
const request = require('request');

function elevationAPIQuery(queryString) {

    return new Promise( (resolve, reject) => {
        let url = 'https://elevation-api.io/api/elevation?resolution=30&key=5nbL4Q8T7bu-a6IbeN1-QLB6zaSqFQ'
        request.post(url, {form: queryString}, (error, response, body) => {
            // console.log( response, body, error);
            console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
            if(error) {
            res.status(400).json({error: error});
            } else {
                resolve(body);
            }
        })
    })

}

module.exports = { elevationAPIQuery };
