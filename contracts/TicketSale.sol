// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TicketSale is ERC1155, Ownable {
    using Strings for uint256;

    struct Ticket {
        string eventName;
        string eventOrganizer;
        string posterCid; // Ubah posterUrl menjadi posterCid
        string ticketImageUrl;
        uint128 price;
        uint64 expiryTimestamp;
        uint64 eventDate;
        uint256 barcode;
        address seller;
        bool sold;
        bool downloaded;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => address) public ticketOwners;
    mapping(uint256 => uint256) public escrowBalances;

    uint256 public ticketCount;
    uint256 public ticketCreationFee = 0.05 ether;
    address payable public admin;

    event TicketCreated(uint256 indexed ticketId, string eventName, string ticketImageUrl);
    event TicketBought(uint256 indexed ticketId, address buyer, uint256 price);
    event TicketDownloaded(uint256 indexed ticketId, address owner);

    constructor() ERC1155("") Ownable(msg.sender) {
        admin = payable(msg.sender);
    }

    // Fungsi untuk membuat tiket oleh penjual
    function createTicket(
        string memory _eventName,
        string memory _eventOrganizer,
        string memory _posterCid, // Ubah parameter ini
        string memory _ticketImageUrl,
        uint128 _price,
        uint64 _expiryTimestamp,
        uint64 _eventDate,
        uint256 _barcode
    ) public payable {
        require(msg.value == ticketCreationFee, "Payment of 0.05 ETH required to create ticket");
        require(_expiryTimestamp > block.timestamp, "Expiry date must be in the future");

        (bool sent, ) = admin.call{value: msg.value}("");
        require(sent, "Failed to send Ether to admin");

        ticketCount++;
        tickets[ticketCount] = Ticket({
            eventName: _eventName,
            eventOrganizer: _eventOrganizer,
            posterCid: _posterCid, // Ubah ini
            ticketImageUrl: _ticketImageUrl,
            price: _price,
            expiryTimestamp: _expiryTimestamp,
            eventDate: _eventDate,
            barcode: _barcode,
            seller: msg.sender,
            sold: false,
            downloaded: false
        });

        emit TicketCreated(ticketCount, _eventName, _ticketImageUrl);
    }

    // Fungsi untuk membeli tiket
    function buyTicket(uint256 _ticketId) public payable {
        Ticket storage ticket = tickets[_ticketId];
        require(!ticket.sold, "Ticket already sold");
        require(msg.value >= ticket.price, "Insufficient ETH to buy ticket");

        escrowBalances[_ticketId] = msg.value;
        ticketOwners[_ticketId] = msg.sender;
        ticket.sold = true;

        _mint(msg.sender, _ticketId, 1, "");

        emit TicketBought(_ticketId, msg.sender, msg.value);
    }

    // Fungsi untuk menandai tiket telah diunduh
    function markAsDownloaded(uint256 _ticketId) public {
        require(ticketOwners[_ticketId] == msg.sender, "You do not own this ticket");
        require(!tickets[_ticketId].downloaded, "Ticket already downloaded");

        tickets[_ticketId].downloaded = true;

        uint256 escrowAmount = escrowBalances[_ticketId];
        require(escrowAmount > 0, "No funds in escrow");

        address seller = tickets[_ticketId].seller;
        (bool sent, ) = seller.call{value: escrowAmount}("");
        require(sent, "Failed to send Ether to seller");

        escrowBalances[_ticketId] = 0;

        emit TicketDownloaded(_ticketId, msg.sender);
    }

    // Fungsi untuk mendapatkan informasi tiket
    function getTicket(uint256 ticketId) public view returns (
        string memory eventName,
        string memory eventOrganizer,
        string memory posterCid, // Ubah ini
        string memory ticketImageUrl,
        uint256 price,
        uint64 expiryTimestamp,
        bool sold,
        bool downloaded
    ) {
        Ticket memory ticket = tickets[ticketId];
        return (
            ticket.eventName,
            ticket.eventOrganizer,
            ticket.posterCid, // Ubah ini
            ticket.ticketImageUrl,
            ticket.price,
            ticket.expiryTimestamp,
            ticket.sold,
            ticket.downloaded
        );
    }

    // Fungsi untuk mendapatkan jumlah total tiket
    function getTicketCount() public view returns (uint256) {
        return ticketCount;
    }
}
