import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';

function TicketList({ contract }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      if (contract) {
        const ticketCount = await contract.getTicketCount();
        const ticketList = [];

        for (let i = 1; i <= ticketCount; i++) {
          const ticket = await contract.getTicket(i);
          const price = ticket[4] ? ticket[4] : ethers.BigNumber.from(0);
          const expiryTimestamp = ticket[5] ? ticket[5].toString() : '0';
          const posterCid = ticket[2]; // CID dari tiket diambil dari Pinata

          // Langsung gunakan URL dari CID Pinata tanpa gambar default
          const posterUrl = posterCid 
            ? `https://gateway.pinata.cloud/ipfs/${posterCid}` 
            : '';

          ticketList.push({
            id: i,
            eventName: ticket[0],
            eventOrganizer: ticket[1],
            posterUrl: posterUrl,
            price: price,
            expiryTimestamp: expiryTimestamp,
            sold: ticket[6],
            downloaded: ticket[7],
          });
        }

        setTickets(ticketList);
      } else {
        console.error("Contract is not defined.");
        alert('Contract not defined. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to fetch tickets. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    if (contract) {
      fetchTickets();
    }
  }, [contract, fetchTickets]);

  const handleBuyTicket = async (ticketId, price) => {
    try {
      const tx = await contract.buyTicket(ticketId, { value: price });
      await tx.wait();
      alert(`Ticket ${ticketId} successfully purchased.`);
      fetchTickets();
    } catch (error) {
      console.error('Error buying ticket:', error);
      alert('Failed to buy ticket.');
    }
  };

  const handleDownload = async (ticketId) => {
    try {
      const tx = await contract.markAsDownloaded(ticketId);
      await tx.wait();
      alert(`Ticket ${ticketId} has been downloaded.`);
      fetchTickets();
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Failed to download ticket.');
    }
  };

  return (
    <div>
      <h2>Daftar Tiket</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>Belum ada tiket, silahkan buat penjualan.</p>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
            <h3>{ticket.eventName}</h3>
            {ticket.posterUrl ? (
              <img 
                src={ticket.posterUrl} 
                alt={ticket.eventName} 
                style={{ width: '375px', height: 'auto', marginBottom: '10px' }} 
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.src = ''; // Tidak menampilkan gambar apapun jika error
                }} 
              />
            ) : (
              <p>No poster available</p> // Ini akan tampil jika posterURL tidak ada
            )}
            <p>Event Organizer: {ticket.eventOrganizer}</p>
            <p>Harga: {ethers.utils.formatEther(ticket.price)} ETH</p>
            <p>Tanggal Terakhir Penjualan: {new Date(Number(ticket.expiryTimestamp) * 1000).toLocaleString()}</p>
            {ticket.sold ? (
              <button onClick={() => handleDownload(ticket.id)} disabled={ticket.downloaded}>
                {ticket.downloaded ? 'Tiket Sudah di Download' : 'Download Ticket'}
              </button>
            ) : (
              <button onClick={() => handleBuyTicket(ticket.id, ticket.price)}>
                Beli Tiket
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default TicketList;
