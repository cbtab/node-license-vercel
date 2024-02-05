const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const axios = require('axios');
const { createWorker } = require('tesseract.js');
const cors = require('cors');
const path = require('path')


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

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, and PNG files are allowed!'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

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


app.post('/licenseDetector', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded!');
    }

    const fileBuffer = req.file.buffer;
    const base64String = fileBuffer.toString('base64');

    const dataUrl = `data:image/jpeg;base64,${base64String}`;

    const response = await axios.post(
      "https://detect.roboflow.com/license-plate-detection-agqth/3",
      dataUrl,
      {
        params: {
          api_key: "B8tP2DxAc04VzSzBvu6J"
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const prediction = response.data.predictions[0];
    const imageWidth = response.data.image.width;
    const imageHeight = response.data.image.height;

    console.log(response.data);
    console.log("Image received from client");

    const { x, y, width, height } = prediction;

    const left = Math.max(0, Math.floor(x - width * 0.5));
    const top = Math.max(0, Math.floor(y - height * 0.5));
    const cropWidth = Math.min(Math.floor(width), imageWidth - left);
    const cropHeight = Math.min(Math.floor(height), imageHeight - top);

    const croppedImageBuffer = await sharp(fileBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();
    const ocrResult = await performOCR(croppedImageBuffer);

    res.json({ license_plate_text: ocrResult});
    return;
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
    return;
  }
});



module.exports = app;