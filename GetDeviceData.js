var params = JSON.parse(value);
var request = new HttpRequest();
request.addHeader('X-Cisco-Meraki-API-Key:' + params.token);
request.addHeader('User-Agent: ZabbixServer/1.1 Zabbix');

var response,
    error_msg = '',
    device = [],
    uplinksLL = [];

function isFloat(n) {
    n = parseFloat(n);
    return Number(n) === n && n % 1 !== 0;
};

function checkNumber(string) {
    if (typeof string !== "string" || isNaN(string) || isFloat(string)) {
        throw 'Incorrect "timespan" parameter given: ' + string + ' Must be an unsigned number';
    }
    return string;
};

function getHttpData(url, attempt) {
    attempt = attempt || 0; // Number of attempts (starting from 0)
    
    if (attempt > 5) {
        throw 'Maximum retry attempts reached for rate limiting.';
    }

    response = request.get(url);

    if (response !== null) {
        try {
            response = JSON.parse(response);
        }
        catch (error) {
            throw 'Failed to parse response received from Meraki API.';
        }
    }

    var statusCode = request.getStatus();
    
    if (statusCode === 429) { // Rate limiting status code
        var retryAfter = request.getHeader('Retry-After');
        var waitTime = retryAfter ? parseInt(retryAfter) * 2000 : (Math.pow(2, attempt) * 2000); // Exponential backoff if no Retry-After header
        
        Zabbix.sleep(waitTime / 2000); // Wait before retry
        return getHttpData(url, attempt + 1); // Then retry
    }

    if (statusCode !== 200) {
        if (response.errors) {
            throw response.errors.join(', ');
        } else {
            throw 'Failed to receive data: invalid response status code (' + statusCode + ').';
        }
    }

    if (typeof (response) !== 'object' || response === null) {
        throw 'Cannot process response data: received data is not an object.';
    }

    return response;
};

try {
    if (params.token === '{' + '$MERAKI.TOKEN}') {
        throw 'Please change {' + '$MERAKI.TOKEN} macro to the proper value.';
    }

    if (params.url.indexOf('http://') === -1 && params.url.indexOf('https://') === -1) {
        params.url = 'https://' + params.url;
    }

    if (!params.url.endsWith('/')) {
        params.url += '/';
    }

    if (typeof params.httpproxy !== 'undefined' && params.httpproxy !== '') {
        request.setProxy(params.httpproxy);
    }

    var timespan = checkNumber('{$MERAKI.UPLINK.LL.TIMESPAN}');

    if (timespan > 86400 || timespan < 1) {
        throw 'Incorrect "timespan" parameter given: ' + timespan + ' Must be between 1 and 86400 seconds.';
    }

    uplinksLL = getHttpData(params.url + 'organizations/' + encodeURIComponent(params.organizationId) + '/devices/uplinksLossAndLatency?timespan=' + timespan);

    if (uplinksLL.length > 0) {
        uplinksLL = uplinksLL.filter(function (device) {
            return device.serial == params.serial;
        });
    }

} catch (error) {
    error_msg = error;
};

return JSON.stringify({
    'uplinksLL': uplinksLL,
    'error': error_msg.toString()
});
