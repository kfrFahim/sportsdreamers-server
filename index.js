const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewere
app.use(cors());
app.use(express.json());

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
    const cartCollection = client.db("summercamp").collection("carts");



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
  })


// Get admit

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





    //     Classes

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    //  Add to Cart

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      if (!email) {
        res.send([]);
      }
      // todo verifyJWT,
      // const decodedEmail = req.decoded.email;
      // if(email !== decodedEmail){
      //   return res.status(403).send({error:true, message: 'forbidden access'});
      // }

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
