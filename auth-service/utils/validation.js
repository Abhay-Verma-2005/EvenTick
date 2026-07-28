import Users from "../models/User.js";
import validate from "validator";

export const validateSignUpData = async (data) => {
    const {firstName, email, password, dateOfBirth}=data.body;
    if(!firstName){
        throw new Error("First Name is required");
    }
    else if(firstName.length < 2 || firstName.length > 20)
    {
        throw new Error("First Name must be between 2 and 20 characters");
    }
    else if (!email || !validate.isEmail(email)){
        throw new Error("Email is not valid");
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
        throw new Error(`This email is already registered as a ${existingUser.role.toUpperCase()}.`);
    }

    else if (!password || !validate.isStrongPassword(password)){
        throw new Error("Password is not strong enough");
    }
    else if (password.length<6 || password.length>16){
        throw new Error("Password must be between 6 to 16 characters long");
    }
    else if(!dateOfBirth || !validate.isDate(dateOfBirth)){
        throw new Error("Invalid Date of Birth");
    }

}

export const ValidateDelete = async (userId) => {
  if (!userId) {
    throw new Error("No user exists");
  }
  
  try {
    const user = await Users.findById(userId);
    if (!user) throw new Error("No user exists")
    }
  catch (err) {
        throw new Error("No user exists");
    }

};

export const ValidatePatch = (req) => {
    const data = req.body;
    const updateObj = ["firstName", "lastName", "dateOfBirth", "password", "city", "photoUrl"];
    
    const ValidUpdate = Object.keys(data).every((k) => {
        return updateObj.includes(k);
    });
    
    if (!ValidUpdate) {
        throw new Error("Update not allowed for these fields");
    }
};