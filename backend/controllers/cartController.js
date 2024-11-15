const { MongoClient } = require("mongodb");
const authenticationMiddleware = require('../middleware/authentication');
const authorizationMiddleware = require('../middleware/authorization');

const client = new MongoClient(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const cartController = {
    addToCart: async (req, res) => {
        let connection;
        try {
            // Authentication middleware
            authenticationMiddleware(['customer'])(req, res, async () => {
                // Authorization middleware
                authorizationMiddleware(['customer'])(req, res, async () => {
                    // Connect to MongoDB
                    connection = await client.connect();
                    console.log("Connected to MongoDB!");

                    const database = connection.db("PorcheWeb");
                    const collection = database.collection("Cart");

                    // Extract item data from the request body
                    const { customerId, productId, quantity } = req.body;

                    // Check if the item is already in the user's cart
                    const existingCartItem = await collection.findOne({ customerId: customerId, productId: productId });

                    if (existingCartItem) {
                        // If the item already exists in the cart, update its quantity
                        await collection.updateOne({ customerId: customerId, productId: productId }, { $inc: { quantity: quantity } });
                    } else {
                        // Otherwise, return an error message
                        return res.status(400).json({ message: 'Invalid action specified' });
                    }

                    res.status(200).json({ message: 'Cart updated successfully' });
                });
            });
        } catch (error) {
            console.error("Error updating cart:", error);
            res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) {
                await connection.close();
                console.log("Connection to MongoDB closed.");
            }
        }
    },

    getCart: async (req, res) => {
        let connection;
        try {
            // Authentication middleware
            authenticationMiddleware(['customer', 'admin'])(req, res, async () => {
                // Authorization middleware
                authorizationMiddleware(['customer', 'admin'])(req, res, async () => {
                    try {
                        connection = await client.connect();
                        console.log("Connected to MongoDB!");
    
                        const database = connection.db("PorcheWeb");
                        const collection = database.collection("Cart");
    
                        let customerId;
                        if (req.user.role === 'admin') {
                            // If admin, extract customer ID from request body
                            customerId = req.body.customerId;
                        } else if (req.user.role === 'customer') {
                            // If customer, extract customer ID from JWT payload
                            customerId = req.user.customerId;
                        }
    
                        console.log("Extracted Customer ID:", customerId);
    
                        // Ensure customerId is defined
                        if (!customerId) {
                            res.status(400).json({ message: "Customer ID is required" });
                            return;
                        }
    
                        // Retrieve cart documents for the specific customer
                        const queryResult = await collection.find({ CustomerID: customerId }).toArray();
    
                        console.log("Query Result:", queryResult);
    
                        // Send the retrieved documents as a JSON response
                        res.json(queryResult);
                    } catch (error) {
                        // Handle errors
                        console.error("Error retrieving cart:", error);
                        res.status(500).json({ message: "Internal server error" });
                    } finally {
                        if (connection) {
                            await connection.close();
                            console.log("Connection to MongoDB closed.");
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Error authenticating/authorizing:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    

    deleteFromCart: async (req, res) => {
        let connection;
        try {
            // Authentication middleware
            authenticationMiddleware(['customer'])(req, res, async () => {
                // Authorization middleware
                authorizationMiddleware(['customer'])(req, res, async () => {
                    connection = await client.connect();
                    console.log("Connected to MongoDB!");
    
                    const database = connection.db("PorcheWeb");
                    const collection = database.collection("Cart");
    
                    // Assuming we get the customer ID from the authenticated user
                    const customerId = req.user.id;
                    const cartItemIdToDelete = parseInt(req.params.CartItemID);
    
                    // Delete the item from the cart with the provided ID
                    const result = await collection.deleteOne({ customerId: customerId, CartItemID: cartItemIdToDelete });
    
                    if (result.deletedCount === 1) {
                        res.status(200).json({ message: 'Cart item deleted successfully' });
                    } else {
                        res.status(404).json({ message: 'Cart item not found' });
                    }
                });
            });
        } catch (error) {
            // Handle errors
            console.error("Error deleting item from cart:", error);
            res.status(500).json({ message: "Internal server error" });
        } finally {
            if (connection) {
                await connection.close();
                console.log("Connection to MongoDB closed.");
            }
        }
    },
    getAllCart: async (req, res) => {
        let connection;
        try {
            // Authentication middleware
            // authenticationMiddleware(['customer', 'admin'])(req, res, async () => {
                // Authorization middleware
                // authorizationMiddleware(['customer', 'admin'])(req, res, async () => {
                    try {
                        connection = await client.connect();
                        console.log("Connected to MongoDB!");
    
                        const database = connection.db("PorcheWeb");
                        const collection = database.collection("Cart");
    
                        // let customerId;
                        // if (req.user.role === 'admin') {
                        //     // If admin, extract customer ID from request body
                        //     customerId = req.body.customerId;
                        // } else if (req.user.role === 'customer') {
                        //     // If customer, extract customer ID from JWT payload
                        //     customerId = req.user.customerId;
                        // }
    
                        // console.log("Extracted Customer ID:", customerId);
    
                        // Ensure customerId is defined
                        // if (!customerId) {
                        //     res.status(400).json({ message: "Customer ID is required" });
                        //     return;
                        // }
    
                        // Retrieve cart documents for the specific customer
                        const queryResult = await collection.find().toArray();
    
                        console.log("Query Result:", queryResult);
    
                        // Send the retrieved documents as a JSON response
                        res.json(queryResult);
                    } catch (error) {
                        // Handle errors
                        console.error("Error retrieving cart:", error);
                        res.status(500).json({ message: "Internal server error" });
                    } finally {
                        if (connection) {
                            await connection.close();
                            console.log("Connection to MongoDB closed.");
                        }
                    }
                // });
            // });
        } catch (error) {
            console.error("Error authenticating/authorizing:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    

}

module.exports = cartController;
