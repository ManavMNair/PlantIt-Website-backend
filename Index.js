
// const {user, setUser} = UserContext(UserContext);
const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const uuid = require("uuid");
// const { UserContext } = require("../FrontEnd/src/Context/UserContext");

app.use(express.json()); //request we get from response will automatically passed through json format
app.use(cors()); //to connect outside react app into port 4000

// Database connection with MogoDB

mongoose.connect("mongodb+srv://ManavMNairMMR:6kfajp5q@cluster0.usobczb.mongodb.net/plantit")


//API creation
app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

//Image storage engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage: storage})

// creating Upload endpoint
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url : `http://localhost:${port}/images/${req.file.filename}`
    })
})

//schema for creating products

const Product = mongoose.model("Product",{
    sellerId :{
        type : String,
        required : true
    },
    productId:{
        type: Number,
        required : true,
    },
    productName:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    subcategory:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    quantity:{
        type:Number,
        required:true,
    },
    imageUrl:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now
    },
    available:{
        type:Boolean,
        default:true
    }
})

app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let Id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0]
        Id = last_product.productId + 1; 
    }else{
        Id = 1;
    }

    const product = new Product({
        sellerId : req.body.sellerId,
        productId : Id ,
        productName : req.body.productName,
        category : req.body.category,
        subcategory : req.body.subcategory,
        price : req.body.price,
        description : req.body.description,
        quantity : req.body.quantity,
        imageUrl : req.body.imageUrl,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success : true,
        productName : req.body.productName,
    })
})

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({ id : req.body.productId })
    console.log("Removed");
    res.json({
        success : true,
        productName : req.body.productName,
    })
})

//Creating API for getting all products

app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//schema creating for user (Buyer)

const Users = mongoose.model('Users',{
    name : {
        type : String,
    },
    email:{
        type:String,
        unique: true,
    },
    password:{
        type: String,
    },
    cartData:{
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
    
})

//Creating api for user registration

app.post('/signup', async (req, res) => {
    try {
        // Check if user already exists with the provided email
        const existingUser = await Users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                errors: "An account with this email already exists"
            });

        }
        let cart ={};
        for (let i = 0;i < 300;i++) {
            cart[i] = 0;    
        }

        // Create a new user object
        const newUser = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password, // Store plain password (Note: Not recommended, hash passwords for security)
            cartData: cart // Initialize empty cart data
        });

        // Save the new user to the database
        await newUser.save();

        // Generate JWT token for the user
        const token = jwt.sign({ userId: newUser._id }, 'secret_ecom');

        // Respond with success message and token
        res.json({ success: true, token });
    } catch (error) {
        console.error("Error during signup:", error);
        // Redirect to the login page
        res.redirect('/login'); // Adjust the URL as needed
    }
});

//Creating endpoint for user(buyer ) login

app.post('/login',async(req,res)=>{
    let user = await Users.findOne({email:req.body.email})
    if(user){
        const passCompare = req.body.password ===user.password;
        if(passCompare){
            const data ={
                user : {
                    id:user.id,
                    sellerId : user.sellerId
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true , token})
        }
        else{
            res.json({
                success: false ,
                error:"Wrong Password"
            })
        }
    }
    else{
        res.json({
            success: false,
            error:"Wrong Email Id"
        })
    }
})

// Seller Account Creation 




//schema for seller database

const Sellers = mongoose.model('Sellers',{
    sellerId : {
        type : String,
        required : true,
    },
    SellerProfPic :{
        type : String ,
    }
    ,
    sellerName : {
        type : String,
    },
    sellerEmail : {
        type : String,
        unique : true,
    },
    sellerPassword : {
        type : String,
    },
    sellerPhoneNumber : {
        type : Number,
        unique : true,
    },
    storeName : {
        type : String,
    },
    storeAddress : {
        type :String,
    },
    storeDescription : {
        type : String,
    },
    paymentInfo : {
        type : String,
    },
    storeBannerUrl :{
        type : String ,
    },
})

// API for seller registration 

app.post('/sellerSignup', async(req,res)=>{
    try{
        //check if seller already exist
       
        const existingUser = await Sellers.findOne({ $or: [{ sellerEmail: req.body.sellerEmail }, { sellerPhoneNumber: req.body.sellerPhoneNumber }] });

        if (existingUser){
            let errorMessage;
            if (existingUser.sellerEmail === req.body.sellerEmail) {
                errorMessage = "An account already exists with the provided email";
            } else if (existingUser.sellerPhoneNumber === req.body.sellerPhoneNumber) {
                errorMessage = "An account already exists with the provided phone number";
            } else {
                errorMessage = "An account already exists with the provided email or phone number";
            }
            return res.status(400).json({
                success : false,
                errors : errorMessage,
            })
        }
        
        const sellerId = uuid.v4();

        const newSeller = new Sellers({
            sellerId : sellerId,
            sellerName : req.body.sellerName,
            sellerEmail : req.body.sellerEmail,
            sellerPassword : req.body.sellerPassword,
            sellerPhoneNumber : req.body.sellerPhoneNumber,
            
        })

        await newSeller.save();
        console.log(newSeller)
        const token = jwt.sign({ sellerId : newSeller.sellerId},'secret_ecom');

        res.json({success : true , token : token, sellerId: sellerId })

    }catch(error){
        console.error("Error during signup : ", error);

        res.redirect('/sellerSignup')
    }
})


//Seller Login 

app.post('/sellerlogin',async(req,res)=>{
    let seller = await Sellers.findOne({sellerEmail:req.body.sellerEmail})
    if(seller){
        const passCompare = req.body.sellerPassword ===seller.sellerPassword;
        if(passCompare){
            const data ={
                seller : {
                    id:seller.id,
                    sellerId : seller.sellerId
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true , token})
        }
        else{
            res.json({
                success: false ,
                error:"Wrong Password"
            })
        }
    }
    else{
        res.json({
            success: false,
            error:"Wrong Email Id"
        })
    }
})

//APi for adding seller details 

app.post('/SellerDetails',async (req,res)=>{
    try{

    
        
        const { storeName, storeAddress, storeDescription , paymentInfo,sellerId,banner} = req.body;
        
        // Find the seller by sellerId
        // const sellerId = req.body.sellerId;
        const seller = await Sellers.findOne({sellerId:sellerId});

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Update store details
        seller.storeName = storeName;
        seller.storeAddress = storeAddress;
        seller.storeDescription = storeDescription;
        seller.paymentInfo = paymentInfo;

        console.log("completed db >>>", seller);
        // Save the updated seller document
        await seller.save();
        
        return res.status(200).json({ success: true, message: 'Store details added successfully' });
    } catch (error) {
        console.error('Error adding store details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
})

app.get('/getprofile',async (req,res)=>{
    const sellerId = req.query.sellerId;
    console.log("sellerID>>",sellerId);

    try{
        const seller = await Sellers.findOne({sellerId:sellerId});

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        } else{
            console.log("Curent seller details (Before updating )>>>",seller)
            res.json(seller);
        }

        
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

})

//endpoint for uploading Store banner

//Image storage engine

const storage2 = multer.diskStorage({
    destination: './upload/sellerImages',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload2 = multer({storage: storage2})

// creating Upload endpoint
app.use('/sellerimages',express.static('upload/sellerImages'))
app.post("/bannerupload",upload2.single('store'),(req,res)=>{
    res.json({
        success:1,
        image_url : `http://localhost:${port}/sellerimages/${req.file.filename}`
    })
})

//endpoint for updating seller details 

app.post('/updatedetails',async (req,res)=>{
    try{

    
        
        const { storeName, storeAddress, storeDescription , upiId,sellerId,storeBannerUrl} = req.body;
        
        console.log("UPI ID >>>", upiId)
        // Find the seller by sellerId
        // const sellerId = req.body.sellerId;
        const seller = await Sellers.findOne({sellerId:sellerId});

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Update store details
        seller.storeName = storeName;
        seller.storeAddress = storeAddress;
        seller.storeDescription = storeDescription;
        seller.paymentInfo = upiId;
        seller.storeBannerUrl = storeBannerUrl;

        console.log("completed db >>>", seller);
        // Save the updated seller document
        await seller.save();
        
        return res.status(200).json({ success: true, message: 'Store details changed successfully' });
    } catch (error) {
        console.error('Error changing store details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
})






app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on port "+port);
    }else{
        console.log("Error :"+error);
    }
})



