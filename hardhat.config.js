require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');

task("fund", "Fund an account with ETH")
  .addParam("account", "The account's address to fund")
  .addParam("amount", "The amount of ETH to send")
  .setAction(async (taskArgs) => {
    const { ethers } = require("hardhat");
    const accounts = await ethers.getSigners();
    
    const fundAmount = ethers.utils.parseEther(taskArgs.amount);
    
    // Assuming the first account is the funder
    const funder = accounts[0];
    
    const tx = await funder.sendTransaction({
      to: taskArgs.account,
      value: fundAmount,
    });

    await tx.wait();
    console.log(`Funded ${taskArgs.amount} ETH to ${taskArgs.account}`);
  });

module.exports = {
    solidity: '0.8.20',
    networks: {
        hardhat: {},
        localhost: {
            url: 'http://127.0.0.1:8545',
        }
    }
};
