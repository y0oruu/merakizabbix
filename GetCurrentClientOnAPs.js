var params = JSON.parse(value);
var request = new HttpRequest();
request.addHeader('X-Cisco-Meraki-API-Key:' + params.token);
request.addHeader('User-Agent: ZabbixServer/1.1 Zabbix');

var response,
    error_msg = '',
    connectedClientsCount = 0;

function getHttpData(url, attempt) {
    attempt = attempt || 0;

    if (attempt > 5) {
        throw 'Maximum retry attempts reached for rate limiting.';
    }

    response = request.get(url);

    if (response !== null) {
        try {
            response = JSON.parse(response);
        } catch (error) {
            throw 'Failed to parse response from Meraki API. Raw response: ' + response;
        }
    }

    var statusCode = request.getStatus();

    if (statusCode === 429) {
        var retryAfter = request.getHeader('Retry-After');
        var waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (Math.pow(2, attempt) * 1000);
        
        Zabbix.sleep(waitTime / 1000); // Attendre avant de réessayer
        return getHttpData(url, attempt + 1);
    }

    if (statusCode !== 200) {
        if (response.errors) {
            throw response.errors.join(', ');
        } else {
            throw 'Failed to receive data: invalid response status code (' + statusCode + ').';
        }
    }

    if (typeof response !== 'object' || response === null) {
        throw 'Cannot process response data: received data is not an object.';
    }

    return response;
}

function getConnectedClients(serial) {
    var url = 'https://api.meraki.com/api/v1/devices/' + encodeURIComponent(serial) + '/clients?timespan=60';
    
    try {
        var clientsData = getHttpData(url);
        return clientsData.length; 
    } catch (error) {
        throw 'Error fetching connected clients: ' + error; // Gestion des erreurs
    }
}

    
    connectedClientsCount = getConnectedClients(params.serial);

// Return the number of connected clients for the AP
return connectedClientsCount;
