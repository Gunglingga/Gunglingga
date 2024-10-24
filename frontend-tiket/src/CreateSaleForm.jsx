import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

function CreateSaleForm({ contract, userAddress }) {
  const [eventName, setEventName] = useState('');
  const [eventOrganizer, setEventOrganizer] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [ticketImageFile, setTicketImageFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [ticketImagePreview, setTicketImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

  // State untuk menyimpan CID
  const [posterCid, setPosterCid] = useState('');
  const [ticketImageCid, setTicketImageCid] = useState('');

  useEffect(() => {
    const fetchTicketCount = async () => {
      if (contract) {
        try {
          const count = await contract.getTicketCount();
          setTicketCount(count.toNumber());
        } catch (error) {
          console.error('Error memuat jumlah tiket:', error);
        }
      }
    };

    fetchTicketCount();
  }, [contract]);

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTicketImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTicketImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTicketImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Fungsi untuk mengunggah file ke Pinata melalui backend
  const uploadToPinata = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.cid) {
        return res.data.cid; // Pastikan respons dari server mengandung 'cid'
      } else {
        throw new Error('CID tidak ditemukan di respons server');
      }
    } catch (error) {
      console.error('Gagal mengunggah ke Pinata:', error.response?.data || error);
      throw new Error('Upload ke Pinata gagal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input
    if (!contract || !userAddress) {
      alert('Pastikan kontrak dan dompet Anda terhubung.');
      return;
    }

    if (!eventName || !eventOrganizer || !eventDate || !ticketPrice || !saleEndDate || !posterFile || !ticketImageFile) {
      alert('Harap isi semua kolom.');
      return;
    }

    setLoading(true);
    try {
      // Unggah gambar tiket dan poster ke Pinata
      const ticketImageUrl = await uploadToPinata(ticketImageFile);
      setTicketImageCid(ticketImageUrl); // Simpan CID

      const posterUrl = await uploadToPinata(posterFile);
      setPosterCid(posterUrl); // Simpan CID

      // Konversi harga tiket ke wei
      const priceInWei = ethers.utils.parseEther(ticketPrice);
      const saleEnd = Math.floor(new Date(saleEndDate).getTime() / 1000);
      const eventDateTimestamp = Math.floor(new Date(eventDate).getTime() / 1000);
      const barcode = Math.floor(Math.random() * 1e12); // Barcode acak

      // Pembuatan tiket di blockchain
      const tx = await contract.createTicket(
        eventName,
        eventOrganizer,
        posterUrl, // Gunakan poster CID yang didapat dari Pinata
        ticketImageUrl, // Gunakan gambar tiket CID yang didapat dari Pinata
        priceInWei,
        saleEnd,
        eventDateTimestamp,
        barcode,
        { value: ethers.utils.parseEther('0.05'), gasLimit: ethers.utils.hexlify(400000) } // Set gas limit
      );

      await tx.wait();
      alert('Tiket berhasil dibuat!');

      // Reset form
      setEventName('');
      setEventOrganizer('');
      setEventDate('');
      setSaleEndDate('');
      setTicketPrice('');
      setPosterFile(null);
      setTicketImageFile(null);
      setPosterPreview('');
      setTicketImagePreview('');
      setPosterCid('');
      setTicketImageCid('');
      setTicketCount((prevCount) => prevCount + 1); // Update jumlah tiket
    } catch (error) {
      console.error('Gagal membuat tiket:', error);
      alert('Gagal membuat tiket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Penjualan Tiket Konser Musik Online</h2>
      <p>Jumlah Tiket: {ticketCount}</p>

      <label>
        Nama Acara:
        <input
          type="text"
          id="eventName"
          placeholder="Masukkan nama acara"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
      </label>

      <label>
        Event Organizer:
        <input
          type="text"
          id="eventOrganizer"
          placeholder="Masukkan penyelenggara"
          value={eventOrganizer}
          onChange={(e) => setEventOrganizer(e.target.value)}
          required
        />
      </label>

      <label>
        Tanggal Acara:
        <input
          type="date"
          id="eventDate"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </label>

      <label>
        Tanggal Akhir Penjualan:
        <input
          type="date"
          id="saleEndDate"
          value={saleEndDate}
          onChange={(e) => setSaleEndDate(e.target.value)}
          required
        />
      </label>

      <label>
        Harga Tiket (ETH):
        <input
          type="number"
          id="ticket-price"
          name="ticketPrice"
          step="0.01"
          placeholder="Masukkan jumlah harga (ETH)"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(e.target.value)}
          required
        />
      </label>

      <label>
        Unggah Poster:
        <input type="file" accept="image/*" onChange={handlePosterChange} required />
      </label>
      {posterPreview && (
        <img
          src={posterPreview}
          alt="Pratinjau Poster"
          style={{ width: '200px', marginTop: '10px' }}
        />
      )}

      <label>
        Unggah Gambar Tiket:
        <input type="file" accept="image/*" onChange={handleTicketImageChange} required />
      </label>
      {ticketImagePreview && (
        <img
          src={ticketImagePreview}
          alt="Pratinjau Gambar Tiket"
          style={{ width: '200px', marginTop: '10px' }}
        />
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Membuat tiket...' : 'Buat Tiket'}
      </button>

      {posterCid && (
        <div>
          <p>CID Poster: {posterCid}</p>
          <img
            src={`https://gateway.pinata.cloud/ipfs/${posterCid}`}
            alt="Poster dari Pinata"
            style={{ width: '200px', marginTop: '10px' }}
          />
        </div>
      )}

      {ticketImageCid && (
        <div>
          <p>CID Gambar Tiket: {ticketImageCid}</p>
          <img
            src={`https://gateway.pinata.cloud/ipfs/${ticketImageCid}`}
            alt="Gambar Tiket dari Pinata"
            style={{ width: '200px', marginTop: '10px' }}
          />
        </div>
      )}
    </form>
  );
}

export default CreateSaleForm;
