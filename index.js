const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ghq7u.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('craftsman_solution').collection('tools');
        const orderCollection = client.db('craftsman_solution').collection('orders');
        const userCollection = client.db('craftsman_solution').collection('users');

        app.get('/tool', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        });

        app.put('/user/:BuyerEmail', async (req, res) => {
            const BuyerEmail = req.params.BuyerEmail;
            const user = req.body;
            const filter = { BuyerEmail: BuyerEmail };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/order', async (req, res) => {
            const BuyerEmail = req.query.BuyerEmail
            const query = { BuyerEmail: BuyerEmail }
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CRAFTSMAN SOLUTION SERVER!')
})

app.listen(port, () => {
    console.log(`CRAFTSMAN app listening on port ${port}`)
})