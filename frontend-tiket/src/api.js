import axios from 'axios';

export const uploadImage = async (image) => {
    const formData = new FormData();
    formData.append('file', image);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY, // Ganti dengan kunci API Anda
            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY // Ganti dengan kunci rahasia Anda
        }
    });

    return response.data; // Pastikan untuk memeriksa struktur data yang dikembalikan
};
