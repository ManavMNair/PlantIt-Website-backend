

// //schema for seller database

// const Sellers = mongoose.model('Sellers',{
//     sellerName : {
//         type : String,
//     },
//     sellerEmail : {
//         type : String,
//         unique : true,
//     },
//     sellerPassword : {
//         type : String,
//     },
//     sellerPhoneNumber : {
//         type : Number ,
//         unique : true,
//     },
//     storeName : {
//         type : String,
//     },
//     storeAddress : {
//         type :String,
//     },
//     storDescription : {
//         type : String,
//     },
//     upiId : {
//         type : String,
//         unique  : true,
//     }
// })

// // API for seller registration 

// application.post('/sellerSignup', async(req,res){
//     try{
//         //check if seller already exist

//         const existingUser = await Sellers.findOne({ $or: [{ email: req.body.email }, { phoneNumber: req.body.phoneNumber }] });

//         if (existingUser){
//             let errorMessage;
//             if (existingUser.email === req.body.email) {
//                 errorMessage = "An account already exists with the provided email";
//             } else if (existingUser.phoneNumber === req.body.phoneNumber) {
//                 errorMessage = "An account already exists with the provided phone number";
//             } else {
//                 errorMessage = "An account already exists with the provided email or phone number";
//             }
//             return res.status(400).json({
//                 success : false,
//                 errors : errorMessage,
//             })
//         }

//         const newSeller = new Sellers({
//             seller : req.body.SellerName,
//             sellerEmail : req.body.sellerEmail,
//             sellerPassword : req.body.sellerPassword,
//             sellerPhoneNumber : req.body.sellerPhoneNumber,
//         })

//         await newSeller.save();

//         const token = jwt.sign({ sellerId : newSeller._id},'secret_ecom');

//         res.json({success : true , token})

//     }catch(error){
//         console.error("Error during signup : ", eroor);

//         res.redirect('/sellerSignup')
//     }
// })

App.post('/SellerDetails',async (req,res)=>{
    try{

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        const decoded = jwt.verify(token, 'your_secret_key'); // Verify the JWT token

        const sellerId = decoded.sellerId; // Extract sellerId from the decoded token

        const { storeName, storeAddress, storeDescription , paymentInfo} = req.body;

        // Find the seller by sellerId
        const seller = await Sellers.findById(sellerId);

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        // Update store details
        seller.storeName = storeName;
        seller.storeAddress = storeAddress;
        seller.storeDescription = storeDescription;
        seller.paymentInfo = paymentInfo;

        // Save the updated seller document
        await seller.save();

        return res.status(200).json({ success: true, message: 'Store details added successfully' });
    } catch (error) {
        console.error('Error adding store details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
})