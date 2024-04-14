const express = require('express');
const Redis = require('ioredis');
const router = express.Router();
const redis = new Redis();
router.post('/', (req, res) => {
    const { msgtype,optype,clientid } = req.body;
    const body = req.body;
    if (!optype || msgtype!=1121) {
        return res.status(400).json({ error: 'Both clientid and optype are required' });
    }
    const fieldValues = Object.entries(body).flat();
    if(optype===100)
    {
        if (!clientid) {
            return res.status(400).json({ error: ' clientid is required' });
        }
        var key = `TenantId_OMSId:${clientid}`;

    redis.hmset(key, fieldValues, (err, result) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ message: 'Client added successfully', result });
    });
}
else if(optype===101){
    if (!clientid) {
        return res.status(400).json({ error: ' clientid is required' });
    }
    var key = `TenantId_OMSId:${clientid}`;
    redis.hmset(key,fieldValues, (err, result) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(201).json({ message: 'Client updated successfully', result });
    });
}
else if(optype===102){
    if (!clientid) {
        return res.status(400).json({ error: ' clientid is required' });
    }
    var key = `TenantId_OMSId:${clientid}`;
    redis.del(key, (err, result) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (result === 0){
            return res.status(404).json({ error: 'Client data not found' });
        }
        res.status(200).json({ message: 'Client deleted successfully', result });
    });
}
else if(optype===103){
    if (!clientid) {
        return res.status(400).json({ error: ' clientid is required' });
    }
    var key = `TenantId_OMSId:${clientid}`;
    redis.hgetall(key, (err, clientData) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!clientData) {
            return res.status(404).json({ error: 'Client data not found' });
        }
        res.json(clientData);
    });
}
else if(optype===104){
    redis.keys('TenantId_OMSId:*', (err, keys) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!keys || keys.length === 0) {
            return res.status(404).json({ error: 'No records found' });
        }
        const getAllDataPromises = keys.map(key => {
            return new Promise((resolve, reject) => {
                redis.hgetall(key, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        });
        Promise.all(getAllDataPromises)
            .then(results => {
                res.json(results);
            })
            .catch(err => {
                console.error('Redis error:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    });
}
});
module.exports = router;