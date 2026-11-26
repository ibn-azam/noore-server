require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT;
const { ObjectId } = require("mongodb");
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

    app.get("/api/perfume", async (req, res) => {
      try {
        const result = await perfumeCollections.find({}).toArray();

        res.status(200).send({
          success: true,
          message: "Perfumes fetched successfully!",
          perfumes: result,
        });
      } catch (error) {
        console.error("Error fetching perfumes:", error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch perfumes.",
        });
      }
    });

    app.get("/api/perfume/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid perfume ID.",
          });
        }

        const perfume = await perfumeCollections.findOne({
          _id: new ObjectId(id),
        });

        if (!perfume) {
          return res.status(404).send({
            success: false,
            message: "Perfume not found.",
          });
        }

        res.status(200).send({
          success: true,
          perfume,
        });
      } catch (error) {
        console.error("Fetch perfume error:", error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch perfume.",
        });
      }
    });

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

    app.patch("/api/perfume/:id", async (req, res) => {
      try {
        const { id } = req.params;

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

        const { ObjectId } = require("mongodb");

        // Validate MongoDB ID
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid product ID.",
          });
        }

        // Prepare updated product data
        const updatedProduct = {
          name: name?.trim(),
          category: category?.trim(),
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          sku: sku?.trim() || null,
          description: description?.trim(),
          status: status || "Active",
          image,
          updatedAt: new Date(),
        };

        // Validate required fields
        if (
          !updatedProduct.name ||
          !updatedProduct.category ||
          !updatedProduct.description ||
          !updatedProduct.image ||
          !Number.isFinite(updatedProduct.price) ||
          updatedProduct.price <= 0 ||
          !Number.isInteger(updatedProduct.stock) ||
          updatedProduct.stock < 0 ||
          (updatedProduct.oldPrice !== null &&
            (!Number.isFinite(updatedProduct.oldPrice) ||
              updatedProduct.oldPrice < updatedProduct.price))
        ) {
          return res.status(400).send({
            success: false,
            message: "Please provide valid product information.",
          });
        }

        const result = await perfumeCollections.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedProduct },
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Perfume not found.",
          });
        }

        res.status(200).send({
          success: true,
          message: "Perfume updated successfully!",
        });
      } catch (error) {
        console.error("Update perfume error:", error);

        res.status(500).send({
          success: false,
          message: "Failed to update perfume.",
        });
      }
    });

    app.delete("/api/perfume/:id", async (req, res) => {
      try {
        const { id } = req.params;

        // Validate MongoDB ID
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid perfume ID.",
          });
        }

        const result = await perfumeCollections.deleteOne({
          _id: new ObjectId(id),
        });

        // Check if perfume exists
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Perfume not found.",
          });
        }

        res.status(200).send({
          success: true,
          message: "Perfume deleted successfully!",
        });
      } catch (error) {
        console.error("Delete perfume error:", error);

        res.status(500).send({
          success: false,
          message: "Failed to delete perfume.",
        });
      }
    });
    // =================//

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
