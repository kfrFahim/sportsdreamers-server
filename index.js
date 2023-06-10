const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');

// Middlewere
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

// Mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6eoz53h.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("summercamp").collection("users");
    const classesCollection = client.db("summercamp").collection("classes");
    const instructorCollection = client.db("summercamp").collection("instructor");
    const myClassesCollection = client.db("summercamp").collection("myClasses");
    const cartCollection = client.db("summercamp").collection("carts");



    // JWT

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })



  // Users Api

  app.get("/users", async(req , res) => {
    const result = await usersCollection.find().toArray();
    res.send(result)
  })

  app.post("/users" ,async(req, res)=>{
    const user= req.body;
    const query = {email : user.email};
    const existingUser = await usersCollection.findOne(query);
    if(existingUser){
      return res.send({message : "User Already exists"})
    }
    const result = await usersCollection.insertOne(user);
    res.send(result)
  });


// Get admit


app.get('/users/admin/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ admin: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === 'admin' }
  res.send(result);
})



app.patch("/users/admin/:id" , async(req, res)=>{
  const id = req.params.id;
  const filter = {_id : new ObjectId(id)};
  const updateDoc = {
    $set: {
      role: "admin"

    } }
  const result = await usersCollection.updateOne(filter, updateDoc)  
  res.send(result)
})

// Make instructor

app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ instructor: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { instructor: user?.role === 'instructor' }
  res.send(result);
})



app.patch("/users/instructor/:id" , async(req, res)=>{
  const id = req.params.id;
  const filter = {_id : new ObjectId(id)};
  const updateDoc = {
    $set: {
      role: "instructor"
    } }
  const result = await usersCollection.updateOne(filter, updateDoc)  
  res.send(result)
})


    //     Classes

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // get new item

    app.get("/newclasses", async (req, res) => {
      const result = await myClassesCollection.find().toArray();
      res.send(result);
    });

    app.post("/newclasses" , async(req, res)=>{
      const newItem = req.body;
      const result = await myClassesCollection.insertOne(newItem);
      res.send(result) 
    })

    // instructors

    app.get("/instructor", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });

 


    //  Add to Cart

    app.get("/carts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      if (!email) {
        res.send([]);
      }
      // todo verifyJWT,
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(403).send({error:true, message: 'forbidden access'});
      }

      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    // Delete from cart

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });


    // Create payment intent

    app.post("/create-payment-intent", async(req, res)=> {
      const {price} = req.body;
      const amount = price*100;
      const paymentIntent = stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //     await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SummerCamp Server Running");
});

app.listen(port, () => {
  console.log(`SummerCamp server is running on port ${port}`);
});

