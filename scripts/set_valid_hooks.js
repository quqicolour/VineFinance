const hre = require("hardhat");

const CrossCenterABI=require("../artifacts/contracts/hook/CrossCenter.sol/CrossCenter.json");
const GovernanceABI=require("../artifacts/contracts/core/Governance.sol/Governance.json");

async function main() {
    const [owner, manager, testUser] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    console.log("manager:",manager.address);
    console.log("testUser:",testUser.address);

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

//   await sendETH(manager.address, "0.03");

    const arbCrossCenterAddress="0xEc2D417D61bAf83e2244b3d58b76d1C882368507";  //arb sepolia
    const opCrossCenterCCTPAddress="0xcA43aA3b5d882840368d1e299f9B6d6eCD8fe443";  //op sepolia
    const baseCrossCenterCCTPAddress="0x210B1A76Ded6efA2846D85E91C0D67C439EfE811";  //base sepolia
    const sepoliaCrossCenterAddress="0x08F7e93ac2EE0508D59d9fd176a5b7Cb06D93948";  //sepolia

    // hook 0
    // const arb_market="0xAe6271f75b159e00203A8b9f97Dc3E3812d19468";
    // const op_market="0xd409d1De3c77f00781bbD1546e2B4a922E75b83F";
    // const base_market="0x44fa87860fAc0866eCb228677a07a7143E9ad003";
    // const sepolia_market="0xA4d26e3adC27DC96d0cfA1a7295b5cFE1B13A963";

    //hook 1
    const arb_market="0xD860F06364B112e40a012518c8591F21b216AB32";
    const op_market="0x614aa77CFA407fc9a11e8A1eF425aA6B99a3824D";
    const base_market="0xfE481a07148a5B8Ed745efbb05515E31fe72ce8A";
    const sepolia_market="0x748E01fCDF1A5010ee069FE069E3F81914f875FC";

    const arbGovernance="0x7fdF06F59a4Fa429c0Cee56d7009624bdF396f90";  //arb sepolia
    const opVineHookCenter="0x88105C02c8c803032D0092aD48373324d0559d48";  //op sepolia
    const baseVineHookCenter="0xE3940D2eeeb6920DB9565c4E3c5944888Ca93eab";  //base sepolia
    const sepoliaVineHookCenter="0xAa98C14031AF07647547bE1c7A24715EF0784472";  //sepolia

    let currentGovernanceAddress;
    let crossCenterAddress;
    let coreMarketAddress;
    if(chainId === 42161n || chainId === 421614n){
        currentGovernanceAddress = arbGovernance;
        crossCenterAddress = arbCrossCenterAddress;
        coreMarketAddress = arb_market;
    }else if(chainId === 10n || chainId === 11155420n){
        currentGovernanceAddress = opVineHookCenter;
        crossCenterAddress = opCrossCenterCCTPAddress;
        coreMarketAddress = op_market;
    }else if(chainId === 8453n || chainId === 84532n){
        currentGovernanceAddress = baseVineHookCenter;
        crossCenterAddress = baseCrossCenterCCTPAddress;
        coreMarketAddress = base_market;
    }else if(chainId === 1n || chainId === 11155111n){
        currentGovernanceAddress = sepoliaVineHookCenter;
        crossCenterAddress = sepoliaCrossCenterAddress;
        coreMarketAddress = sepolia_market;
    }else{
        throw("Not chain id")
    }

    const ownerGovernance=new ethers.Contract(currentGovernanceAddress, GovernanceABI.abi, testUser);
    const initialize = await ownerGovernance.initialize(coreMarketAddress);
    await initialize.wait();
    console.log("initialize success");

    const CrossCenter=new ethers.Contract(crossCenterAddress, CrossCenterABI.abi, owner);
    const arbBytes32Market = await CrossCenter.addressToBytes32(arb_market);
    console.log("arbBytes32Market:", arbBytes32Market);
    const opBytes32Market = await CrossCenter.addressToBytes32(op_market);
    console.log("opBytes32Market:", opBytes32Market);
    const baseBytes32Market = await CrossCenter.addressToBytes32(base_market);
    console.log("baseBytes32Market:", baseBytes32Market);
    const sepoliaBytes32Market = await CrossCenter.addressToBytes32(sepolia_market);
    console.log("sepoliaBytes32Market:", sepoliaBytes32Market);
    
    const Governance=new ethers.Contract(currentGovernanceAddress, GovernanceABI.abi, manager);
    // const Governance=new ethers.Contract(currentGovernanceAddress, GovernanceABI.abi, testUser);
    const arbBatchSetValidHooks=await Governance.batchSetValidHooks(3, [arbBytes32Market]);
    await arbBatchSetValidHooks.wait();
    console.log("arbBatchSetValidHooks success");
    const opBatchSetValidHooks=await Governance.batchSetValidHooks(2, [opBytes32Market]);
    await opBatchSetValidHooks.wait();
    console.log("opBatchSetValidHooks success");
    const baseBatchSetValidHooks=await Governance.batchSetValidHooks(6, [baseBytes32Market]);
    await baseBatchSetValidHooks.wait();
    console.log("baseBatchSetValidHooks success");
    const sepoliaBatchSetValidHooks=await Governance.batchSetValidHooks(0, [sepoliaBytes32Market]);
    await sepoliaBatchSetValidHooks.wait();
    console.log("sepoliaBatchSetValidHooks success");
    

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});