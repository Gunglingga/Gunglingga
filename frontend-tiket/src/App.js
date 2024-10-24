import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import CreateSaleForm from './CreateSaleForm';
import TicketList from './TicketList';
import './App.css';
import { contractAddress, contractABI } from './contractConfig';

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState(''); // State untuk menyimpan saldo pengguna

  // Fungsi untuk menghubungkan wallet pengguna
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        console.log('Connected account:', accounts[0]);

        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        const userBalance = await newProvider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(userBalance)); // Format saldo dari Wei ke ETH

        const signer = newProvider.getSigner();
        const ticketContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(ticketContract);
      } catch (error) {
        console.error('User denied wallet connection:', error);
        alert('Gagal terhubung ke MetaMask. Coba lagi.');
      }
    } else {
      alert('Please install MetaMask.');
    }
  };

  // Listener untuk mendeteksi perubahan akun di MetaMask
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      connectWallet(); // Perbarui koneksi dengan akun baru
    } else {
      setAccount('');
      setContract(null);
      setBalance('');
    }
  }, []); // Kosongkan array dependensi karena tidak ada state atau props yang digunakan

  const handleChainChanged = () => {
    window.location.reload(); // Refresh halaman saat jaringan berubah
  };

  useEffect(() => {
    connectWallet();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged]); // Menambahkan handleAccountsChanged ke array dependensi

  return (
    <div className="container">
      <div className="user-info">
        {account ? (
          <>
            <p>Connected as: <strong>{account}</strong></p>
            <p>Balance: <strong>{balance} ETH</strong></p> {/* Tampilkan saldo */}
          </>
        ) : (
          <p>Please connect your wallet.</p>
        )}
      </div>

      <div className="ticket-list-panel">
        {contract && <TicketList contract={contract} />}
      </div>

      <div className="form-panel">
        {contract && <CreateSaleForm contract={contract} userAddress={account} />}
      </div>
    </div>
  );
};

export default App;
