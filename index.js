require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationsErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();

    const db = client.db("noore");
    const userCollections = db.collection("user");
    const perfumeCollections = db.collection("perfume");

    app.get("/api/user", async (req, res) => {
      const cursor = userCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //All Products Api
    app.post("/api/perfume", async (req, res) => {
      try {
        const {
          name,
          category,
          price,
          oldPrice,
          stock,
          sku,
          description,
          status,
          image,
        } = req.body;

        if (
          !name ||
          !category ||
          !price ||
          stock === undefined ||
          !description ||
          !image
        ) {
          return res.status(400).send({
            success: false,
            message: "Please provide all required fields.",
          });
        }

        const productData = {
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          sku: sku?.trim() || null,
          description: description.trim(),
          status: status || "Active",
          image,
          createdAt: new Date(),
        };

        if (
          !Number.isFinite(productData.price) ||
          productData.price <= 0 ||
          !Number.isInteger(productData.stock) ||
          productData.stock < 0
        ) {
          return res.status(400).send({
            success: false,
            message: "Invalid price or stock.",
          });
        }

        const result = await perfumeCollections.insertOne(productData);

        res.status(201).send({
          success: true,
          message: "Product added successfully!",
          product: {
            _id: result.insertedId,
            ...productData,
          },
        });
      } catch (error) {
        console.error("Product creation error:", error);

        res.status(500).send({
          success: false,
          message: "Failed to add product.",
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment.You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
};
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Noore Server is Running On ${port}`);
});
