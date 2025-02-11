const hre = require("hardhat");

const GovernanceABI=require("../artifacts/contracts/core/Governance.sol/Governance.json");
const CrossCenterABI=require("../artifacts/contracts/hook/CrossCenter.sol/CrossCenter.json");
const Set=require('../set.json');

async function main() {
    const [owner, manager] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    console.log("manager:",manager.address);
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log("Chain ID:", chainId);

    async function sendETH(toAddress, amountInEther) {
      const amountInWei = ethers.parseEther(amountInEther); 
      const tx = {
          to: toAddress,
          value: amountInWei,
      };
      const transactionResponse = await owner.sendTransaction(tx);
      await transactionResponse.wait();
      console.log("Transfer eth success");
  }

  // await sendETH(manager.address, "0.1");

    let config;
    if(chainId === 1n){
      config = Set.Ethereum_Mainnet;
    }else if(chainId === 10n){
      config = Set.Op_Mainnet;
    }else if(chainId === 42161n){
      config = Set.Arbitrum_Mainnet;
    }else if(chainId === 8453n){
      config = Set.Base_Mainnet;
    }else if(chainId === 11155111n){
      config = Set.Sepolia;
    }else if(chainId === 11155420n){
      config = Set.Op_Sepolia;
    }else if(chainId === 421614n){
      config = Set.Arbitrum_Sepolia;
    }else if(chainId === 84532n){
      config = Set.Base_Sepolia;
    }else{
      throw("Not chain id");
    }

    const arbLendMainFactoryAddress = "0x4d354C90651B07Be872fC0205AA4D1CD7630e2e5";
    const opL2LendFactoryAddress = "0x83527e33C2F7D13DeBe578Ff0C926b121c46c7dc";
    const baseL2LendFactoryAddress = "0x0db31d955A6e6DB2F35BF5f27C5D913CdF3E6e4C";
    const sepoliaETHLendFactoryAddress = "0x50e8480F2Ca26371378F14673085D36730003600";

    const arbCrossCenterAddress="0xEc2D417D61bAf83e2244b3d58b76d1C882368507";  //arb sepolia
    const opCrossCenterCCTPAddress="0xcA43aA3b5d882840368d1e299f9B6d6eCD8fe443";  //op sepolia
    const baseCrossCenterCCTPAddress="0x210B1A76Ded6efA2846D85E91C0D67C439EfE811";  //base sepolia
    const sepoliaCrossCenterAddress="0x08F7e93ac2EE0508D59d9fd176a5b7Cb06D93948";  //sepolia

    if(chainId === 42161n || chainId === 421614n){
      const CrossCenter=new ethers.Contract(arbCrossCenterAddress, CrossCenterABI.abi, manager);
      const factorys=[arbLendMainFactoryAddress];
      const states=['0x01'];
      const batchSetValidCaller = await CrossCenter.batchSetValidCaller(factorys, states);
      await batchSetValidCaller.wait();
      console.log("batchSetValidCaller success");
    }else if(chainId === 10n || chainId === 11155420n){
        const CrossCenter=new ethers.Contract(opCrossCenterCCTPAddress, CrossCenterABI.abi, manager);
        const factorys=[opL2LendFactoryAddress];
        const states=['0x01'];
        const batchSetValidCaller = await CrossCenter.batchSetValidCaller(factorys, states);
        await batchSetValidCaller.wait();
        console.log("batchSetValidCaller success");
    }else if(chainId === 8453n || chainId === 84532n){
        const CrossCenter=new ethers.Contract(baseCrossCenterCCTPAddress, CrossCenterABI.abi, manager);
        const factorys=[baseL2LendFactoryAddress];
        const states=['0x01'];
        const batchSetValidCaller = await CrossCenter.batchSetValidCaller(factorys, states);
        await batchSetValidCaller.wait();
        console.log("batchSetValidCaller success");
    }else if(chainId === 1n || chainId === 11155111n){
        const CrossCenter=new ethers.Contract(sepoliaCrossCenterAddress, CrossCenterABI.abi, manager);
        const factorys=[sepoliaETHLendFactoryAddress]
        const states=['0x01'];
        const batchSetValidCaller = await CrossCenter.batchSetValidCaller(factorys, states);
        await batchSetValidCaller.wait();
        console.log("batchSetValidCaller success");
    }else{
        throw("Not chain id")
    }
    

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});