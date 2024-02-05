const express = require('express');

const cors = require('cors');

const { createWorker } = require('tesseract.js');


const app = express()
const PORT = 4000
app.use(cors());

app.listen(PORT, () => {
    console.log("Server Running")
})


app.get('/', (req,res)=>{
    res.send("this is api")
})

app.get('/test', (req,res)=>{
    res.send("this is api")
})


const performOCR = async (imageBuffer) => {
  const worker = await createWorker('tha');
  try {
    await worker.setParameters({
      tessedit_char_whitelist: 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ0123456789',
      tessedit_min_conf: 10,
    });


    const base64Image = imageBuffer.toString('base64');

    const { data: { text } } = await worker.recognize(`data:image/jpeg;base64,${base64Image}`);
    console.log(text);
    return text;
  } finally {
    if (typeof worker.terminate === 'function') {
      await worker.terminate();
    }
  }
};


app.post('/licenseDetector', async (req, res) => {
    try {
      
        const base64String = req.body.image;

        const fileBuffer = Buffer.from(base64String, 'base64');


        const ocrResult = await performOCR(fileBuffer);

        res.json({ license_plate_text: ocrResult });
        return;
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
        return;
    }
});


module.exports = app;