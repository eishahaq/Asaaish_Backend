const mongoose = require('mongoose')
const Schema = mongoose.Schema 
const bcrypt = require('bcrypt')

const UserSchema = new Schema({

  _id: mongoose.Schema.Types.ObjectId,
  
    role:{
      type: String,
      enum: ["Customer","Vendor","Admin"],
    }, 
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }, 
    status:{
        type: String,
        enum: ["ACTIVE", "INACTIVE"]
    }
})

UserSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(this.password, salt)
      this.password = hashedPassword
    }
    next()
  } catch (error) {
    next(error)
  }
})


UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password)
  } catch (error) {
    throw error
  }
}

const user = mongoose.model('User', UserSchema)
module.exports = user
<<<<<<< HEAD
=======

//Add admin role
>>>>>>> 0b1847d2d255b4aa7477c63be969714165fecbc5
