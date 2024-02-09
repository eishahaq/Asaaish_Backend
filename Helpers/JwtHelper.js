const JWT = require('jsonwebtoken')
const createError = require('http-errors')
const User = require('../Models/User')
require('dotenv').config();

module.exports = {
    signAccessToken: (userId) =>{
        return new Promise((resolve,reject)=>{
            const payload = {}
            const secret = "wow"
            const options = {
                expiresIn :'1yr',
                issuer: 'pickurpage.com',
                audience: userId,
            }
            JWT.sign(payload, secret, options, (err,token)=> {
                if(err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
     
    },
    
    verifyAccessToken: (req, res, next) => {
      if (!req.headers['authorization']) return next(createError.Unauthorized())
      const authHeader = req.headers['authorization']
      const bearerToken = authHeader.split(' ')
      const token = bearerToken[1]
      JWT.verify(token, "wow", (err, payload) => {
        if (err) {
          const message =
            err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
          return next(createError.Unauthorized(message))
        }
        req.payload = payload
        next()
      })
    },

    signRefreshToken: (userId) =>{
        return new Promise((resolve,reject)=>{
            const payload = {}
            const secret = "haha"
            const options = {
                expiresIn :'1yr',
                issuer: 'pickurpage.com',
                audience: userId,
            }
            JWT.sign(payload, secret, options, (err,token)=> {
                if(err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },

    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve,reject)=> {
            JWT.verify(refreshToken,"haha",(err,payload)=>{
                if (err) return reject(createError.Unauthorized())
                const userId = payload.aud
                resolve(userId)
            })   
        })
    }
    
}