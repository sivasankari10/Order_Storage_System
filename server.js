const express = require('express');
const bodyParser = require('body-parser');
const clinetInfoApi = require('./clinetInfoApi');
const orderInfoApi = require('./orderInfoApi');
const app = express();

app.use(bodyParser.json());

app.use('/api/client', clinetInfoApi);
app.use('/api/order', orderInfoApi);

const PORT =3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
