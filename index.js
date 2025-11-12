const express = require('express')
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json())


const uri = "mongodb+srv://homedbUser:Cj7crJZ29Eqsaq7Z@cluster0.2o3am.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('smart server is running')
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('home_db')
        const PropertiesCollection = db.collection('Properties')
        const usersCollection = db.collection('users');
        const reviewsCollection = db.collection("reviews");



        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                res.send({ message: 'user already exits.' })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }


        })

        // Add properties api
        app.post('/properties', async (req, res) => {
            const newProperty = req.body;
            // console.log(newProperty);

            const result = await PropertiesCollection.insertOne(newProperty);
            res.send(result);
        });

        app.get('/featured-properties', async (req, res) => {
            const cursor = PropertiesCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await PropertiesCollection.findOne(query);
            res.send(result);
        });

        app.post("/properties", async (req, res) => {
            const property = req.body;

            property.posted_date = new Date();
            property.user = {
                name: user?.name,
                email: user?.email,
                photo: user?.photoURL
            };

            const result = await PropertiesCollection.insertOne(property);
            res.send(result);
        });

        // AllProperties api
        app.get("/properties", async (req, res) => {
            const { sort, search } = req.query;

            let query = {};
            if (search) {
                query = { name: { $regex: search, $options: "i" } };
            }

            let sortOption = {};
            if (sort === "asc") sortOption = { price: 1 };
            else if (sort === "desc") sortOption = { price: -1 };
            else sortOption = { created_at: -1 }; // default: newest first

            const cursor = PropertiesCollection.find(query).sort(sortOption);
            const result = await cursor.toArray();
            res.send(result);
        });

        // review api
        app.post("/reviews", async (req, res) => {
            const { propertyId, user, rating, reviewText } = req.body;
            if (!propertyId || !user || !rating || !reviewText) {
                return res.status(400).send({ message: "All fields are required" });
            }

            const newReview = {
                propertyId,
                user: {
                    name: user?.name,
                    email: user?.email,
                    photo: user?.photoURL,
                    created_at: user.created_at || new Date(),
                },
                rating,
                reviewText,
                createdAt: new Date(),
            };

            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
        });

        app.get("/reviews-user", async (req, res) => {
            const email = req.query.email;
            if (!email) return res.status(400).send({ message: "Email is required" });

            const reviews = await reviewsCollection
                .find({ "user.email": email })
                .sort({ createdAt: -1 })
                .toArray();

            console.log('reviews', reviews);

            for (let i = 0; i < reviews.length; i++) {
                const property = await PropertiesCollection.findOne({ _id: new ObjectId(reviews[i].propertyId) });
                reviews[i].propertyName = property?.name;
                reviews[i].propertyThumbnail = property?.image;
            }

            res.send(reviews);
        });

        app.get("/reviews/:propertyId", async (req, res) => {
            const { propertyId } = req.params;
            const reviews = await reviewsCollection
                .find({ propertyId })
                .sort({ createdAt: -1 })
                .toArray();
            res.send(reviews);
        });

        // my property api
        app.get("/properties", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };

            const result = await PropertiesCollection.find(query).toArray();
            // console.log('result', query, result);

            res.send(result);
        });

        app.post("/properties", async (req, res) => {
            const property = req.body;


            if (!property.created_at) {
                property.created_at = new Date();
            }

            const result = await PropertiesCollection.insertOne(property);
            res.send(result);
        });

        // app.delete("/properties/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const result = await PropertiesCollection.deleteOne({ _id: new ObjectId(id) });
        //     res.send(result);
        // });

        // update api
        app.put("/properties/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                if ("created_at" in updateData) {
                    delete updateData.created_at;
                }

                const result = await PropertiesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Failed to update property" });
            }
        });


        app.delete("/properties/:id", async (req, res) => {
            const id = req.params.id;

            const result = await PropertiesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`smart server is running on port: ${port}`);

})