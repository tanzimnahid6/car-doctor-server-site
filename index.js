const express = require("express")
const cors = require("cors")
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000
require("dotenv").config()

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5xnybaj.mongodb.net/?retryWrites=true&w=majority`

//middleware========
app.use(cors())
app.use(express.json())
app.get("/", (req, res) => {
  res.send("Doctor is running")
})

//connect to database

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
//===========Verify Jwt Token function================================
const verifyJwt = (req,res,next)=>{
    console.log('Hitting verify jwt');
    console.log(req.headers.authorization);
    const authorization = req.headers.authorization
    if(!authorization){
      return res.status(401).send({error:true,message:'Unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    console.log('token inside verify jwt',token);
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{
      if(error){
        return res.status(403).send({error:true,message:'Unauthorized access token'}) 
      }
      req.decoded = decoded
      next()
    })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()

    const serviceCollection = client.db("carDoctor").collection("services")
    const bookingCollection = client.db("carDoctor").collection("bookings")

    //get services all data from db==========
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find().toArray()
      res.send(result)
    })

    //JWT connection==== =================

    app.post('/jwt',(req,res)=>{
      const user = req.body 
      console.log(user);

      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'2h'
      });
      res.send({token})

    })


    //find single data from db ============
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      //this way we get specific  property's of an object throw object====
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      }
      result = await serviceCollection.findOne(query, options)
      res.send(result)
    })

    //bookings=============================={POST OPERATION}
    app.post("/bookings", async (req, res) => {
      const booking = req.body
      
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    //getting specific booking data from db=========={GET OPERATION}
    app.get("/bookings",verifyJwt, async (req, res) => {
     console.log("Came back after verify");
      
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    //delete booking data===============================
    app.delete('/bookings/:id',async(req,res)=>{
      const id = req.params.id 
      
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result)
    })

    //UPDATE DATA========================================
    app.patch('/bookings/:id',async(req,res)=>{
      const updatedBooking = req.body 
      const id = req.params.id
      console.log(updatedBooking);
      const filter = { _id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result)
  

    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 })
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.listen(port, () => {
  console.log("Car Doctor Server is running on port 5000")
})
