const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectID } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ghq7u.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

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

        app.post('/tool', async (req, res) => {
            const newItem = req.body;
            const result = await toolCollection.insertOne(newItem);
            res.send(result);
        })

        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/admin/:BuyerEmail', async (req, res) => {
            const BuyerEmail = req.params.BuyerEmail;
            const user = await userCollection.findOne({ BuyerEmail: BuyerEmail });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });

        app.put('/user/admin/:BuyerEmail', verifyJWT, async (req, res) => {
            const BuyerEmail = req.params.BuyerEmail;
            const requester = req.decoded.BuyerEmail;
            const requesterAccount = await userCollection.findOne({ BuyerEmail: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { BuyerEmail: BuyerEmail };
                const updatedDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updatedDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden' })
            }

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
            const token = jwt.sign({ BuyerEmail: BuyerEmail },
                process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });

        app.get('/order', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });


        app.get('/order', verifyJWT, async (req, res) => {
            const BuyerEmail = req.query.BuyerEmail;
            const authorization = req.headers.authorization;
            // console.log('auth header', authorization);
            const query = { BuyerEmail: BuyerEmail };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.delete('/order/:itemId', async (req, res) => {
            const itemId = req.params.itemId;
            const query = { _id: ObjectID(itemId) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })
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