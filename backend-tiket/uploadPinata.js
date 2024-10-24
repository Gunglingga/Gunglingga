const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await axios.post('http://localhost:5000/api/upload', formData); // Ganti dengan URL server backend Anda
    return res.data.cid; // Kembalikan CID dari respons backend
  } catch (error) {
    console.error('Gagal mengunggah ke Pinata:', error);
    throw new Error('Upload ke Pinata gagal');
  }
};
