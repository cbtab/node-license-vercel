const express = require('express')
const app = express()
const PORT = 4000

app.listen(PORT, () => {
    console.log("Server Running")
})


app.get('/', (req,res)=>{
    res.send("this is api")
})

app.get('/test', (req,res)=>{
    res.send("this is api")
})


module.exports = app