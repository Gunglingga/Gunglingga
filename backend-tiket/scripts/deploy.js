// scripts/deploy.js
import pkg from "hardhat"; // Mengimpor hardhat sebagai default
const { ethers } = pkg; // Mengekstrak ethers dari hardhat

async function main() {
  const TicketSale = await ethers.getContractFactory("TicketSale");
  const ticketSale = await TicketSale.deploy();

  await ticketSale.deployed();

  console.log("TicketSale contract deployed to:", ticketSale.address);
}

// Menjalankan script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
