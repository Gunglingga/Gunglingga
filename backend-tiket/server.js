import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import FormData from 'form-data';

dotenv.config(); // Pastikan variabel lingkungan sudah dimuat

const app = express();
const port = process.env.PORT || 5000; // Gunakan PORT dari variabel lingkungan

// Middleware CORS
app.use(cors({
  origin: '*' // Anda bisa membatasi domain yang diizinkan, gunakan '*' untuk mengizinkan semua
}));

const upload = multer({ storage: multer.memoryStorage() }); // Simpan file di memori

// Fungsi untuk mengirimkan error yang lebih baik
const sendErrorResponse = (res, message, statusCode = 500) => {
  console.error(message);
  res.status(statusCode).send(message);
};

// Endpoint untuk mengunggah file ke Pinata
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 'Tidak ada file yang diunggah.', 400);
  }

  const formData = new FormData();
  formData.append('file', req.file.buffer, req.file.originalname);

  // Tambahkan log untuk memeriksa kunci API
  console.log('PINATA_API_KEY:', process.env.PINATA_API_KEY);
  console.log('PINATA_API_SECRET_KEY:', process.env.PINATA_API_SECRET_KEY);

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        pinata_api_key: process.env.PINATA_API_KEY, // Periksa typo di sini
        pinata_secret_api_key: process.env.PINATA_API_SECRET_KEY, // Ini diperbaiki dari typo sebelumnya
      },
    });

    const cid = response.data.IpfsHash; // Dapatkan CID dari respons

    // Periksa apakah CID ada dalam respons
    if (!cid) {
      return sendErrorResponse(res, 'Gagal mendapatkan CID dari respons Pinata.', 500);
    }

    res.status(200).json({ cid }); // Kirim CID ke frontend
  } catch (error) {
    sendErrorResponse(res, 'Gagal mengunggah ke Pinata: ' + error.message);
  }
});

// Proxy untuk mengambil gambar dari Pinata
app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return sendErrorResponse(res, 'URL gambar tidak disediakan.', 400);
  }

  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
    });

    const contentType = response.headers['content-type']; // Dapatkan tipe konten dari respons
    res.setHeader('Content-Type', contentType); // Setel tipe konten sesuai respons

    // Alirkan gambar dari Pinata ke frontend
    response.data.pipe(res);
  } catch (error) {
    sendErrorResponse(res, 'Error fetching image: ' + error.message);
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
