const hre = require("hardhat");

//arb sepolia Governance: 0x7fdF06F59a4Fa429c0Cee56d7009624bdF396f90
//arb sepolia CrossCenter: 0xEc2D417D61bAf83e2244b3d58b76d1C882368507

//op sepolia VineHookCenter Address: 0x88105C02c8c803032D0092aD48373324d0559d48
//op sepolia CrossCenter Address: 0xcA43aA3b5d882840368d1e299f9B6d6eCD8fe443

//base sepolia VineHookCenter Address: 0xE3940D2eeeb6920DB9565c4E3c5944888Ca93eab
//base sepolia CrossCenter Address: 0x210B1A76Ded6efA2846D85E91C0D67C439EfE811

//sepolia VineHookCenter Address: 0xAa98C14031AF07647547bE1c7A24715EF0784472
//sepolia CrossCenter Address: 0x08F7e93ac2EE0508D59d9fd176a5b7Cb06D93948

const GovernanceABI = require("../artifacts/contracts/core/Governance.sol/Governance.json");
const VineHookCenterABI = require("../artifacts/contracts/core/VineHookCenter.sol/VineHookCenter.json");
const Set=require('../set.json');

async function main() {
    const [owner, manager] = await hre.ethers.getSigners();
    console.log("owner:", owner.address);
    console.log("manager:", manager.address);
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

    // await sendETH(manager.address, "0.03");

    const feeManager = owner.address;
    const caller = manager.address;

    
    const sepoliaTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const sepoliaMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    const arbTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const arbMessageTransmitter="0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";

    const opTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const opMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    const baseTokenMessage="0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const baseMessageTransmitter="0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

    let TokenMessage;
    let MessageTransmitter;
    if(chainId === 42161n || chainId === 421614n){
        TokenMessage = arbTokenMessage;
        MessageTransmitter = arbMessageTransmitter
    }else{
        TokenMessage = opTokenMessage;
        MessageTransmitter = opMessageTransmitter
    }

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

    let Governance;
    let GovernanceAddress;
    let thisGovernanceABI;
    if (chainId === 42161n || chainId === 421614n) {
        thisGovernanceABI = GovernanceABI.abi;
        const governance = await ethers.getContractFactory("Governance");
        Governance = await governance.deploy(owner.address, manager, feeManager, caller);
        GovernanceAddress = await Governance.target;
        console.log("Governance Address:", GovernanceAddress);
    } else{
        thisGovernanceABI = VineHookCenterABI.abi;
        const governance = await ethers.getContractFactory("VineHookCenter");
        Governance = await governance.deploy(owner.address, manager, caller);
        GovernanceAddress = await Governance.target;
        console.log("VineHookCenter Address:", GovernanceAddress);
    }

    const crossCenter = await ethers.getContractFactory("CrossCenter");
    const CrossCenter = await crossCenter.deploy(owner.address, manager, GovernanceAddress, TokenMessage, MessageTransmitter);
    const CrossCenterAddress = await CrossCenter.target;
    console.log("CrossCenter Address:", CrossCenterAddress);
    
    
    const managerGovernance = new ethers.Contract(GovernanceAddress, thisGovernanceABI, manager);
    const changeCrossCenter = await managerGovernance.changeCrossCenter(CrossCenterAddress);
    await changeCrossCenter.wait();
    console.log("changeCrossCenter success");
    if(chainId != 1n && chainId != 11155111n){
        const changeL2Encode = await managerGovernance.changeL2Encode(config.L2Encode);
        await changeL2Encode.wait();
        console.log("changeL2Encode success");
    }

    if (chainId === 42161n || chainId ===421614n) {
      //7 days
      const register = await managerGovernance.register(
        1000,
        90000n,
        604800n,
        manager.address
      );
      await register.wait();
      console.log("register success");
  } else{
      const register = await managerGovernance.register();
      await register.wait();
      console.log("register success");
  }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});