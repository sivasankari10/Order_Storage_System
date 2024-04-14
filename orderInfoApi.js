const express = require('express');
const Redis = require('ioredis');
const router = express.Router();
const redis = new Redis();

router.post('/', (req, res) => {
    const { msgtype, optype, clientid, Orderid, TenantId, OMSId, Token } = req.body; // Destructure relevant fields from the request body
    const body = req.body;

    // Check if required fields are provided
    if (!clientid || !optype) {
        return res.status(400).json({ error: 'Both clientid and optype are required' });
    }

    // Check msgtype value
    if (msgtype !== 1120) {
        return res.status(400).json({ error: 'msgtype must be 1120' });
    }

    // Check client existence
    const clientKey = `TenantId_OMSId:${clientid}`;
    redis.exists(clientKey, (err, exists) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!exists) {
            return res.status(400).json({ error: 'Client not found to place order' });
        } else {
            // Flatten body object to get field values
            const fieldValues = Object.entries(body).flat();

            // Perform operations based on optype
            if (optype === 100) {
                // Add an order
                if (!body['Ordertype']) {
                    return res.status(400).json({ error: 'Ordertype is required' });
                }
                const orderKey = `TenantId_${TenantId}_OMSId_${OMSId}_ClientId_${clientid}_Token_${Token}_OrderId_${Orderid}`;
                redis.exists(orderKey, (err, orderExists) => {
                    if (err) {
                        console.error('Redis error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    if (orderExists) {
                        return res.status(400).json({ error: 'Order already exists' });
                    } else {
                        redis.hmset(orderKey, fieldValues, (err, result) => {
                            if (err) {
                                console.error('Redis error:', err);
                                return res.status(500).json({ error: 'Internal server error' });
                            }
                            res.status(201).json({ message: 'Order added successfully', result });
                        });
                    }
                });
            } else if (optype === 101 || optype === 102 || optype === 103) {
                // Update, delete, or retrieve an order
                if (!body['Ordertype'] || !Orderid) {
                    return res.status(400).json({ error: 'Ordertype and Orderid are required' });
                }
                const key = `TenantId_OMSId_ClientId_Token:${Orderid}`; // Construct key
                if (optype === 101) {
                    // Update logic
                    redis.hmset(key, fieldValues, (err, result) => {
                        if (err) {
                            console.error('Redis error:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        res.status(200).json({ message: 'Order updated successfully', result });
                    });
                } else if (optype === 102) {
                    // Delete logic
                    redis.del(key, (err, result) => {
                        if (err) {
                            console.error('Redis error:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        if (result === 0) {
                            return res.status(404).json({ error: 'Order data not found' });
                        }
                        res.status(200).json({ message: 'Order deleted successfully', result });
                    });
                } else if (optype === 103) {
                    // Retrieve logic
                    redis.hgetall(key, (err, orderData) => {
                        if (err) {
                            console.error('Redis error:', err);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        if (!orderData) {
                            return res.status(404).json({ error: 'Order data not found' });
                        }
                        res.status(200).json(orderData);
                    });
                }
            } else if (optype === 104) {
                // Retrieve all orders
                redis.keys('TenantId_OMSId_ClientId_Token:*', (err, keys) => {
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
            } else {
                // Invalid optype
                return res.status(400).json({ error: 'Invalid optype' });
            }
        }
    });
});

module.exports = router;
