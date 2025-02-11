const hre = require("hardhat");

const GovernanceABI=require("../artifacts/contracts/core/Governance.sol/Governance.json");
const VineHookCenterABI=require("../artifacts/contracts/core/VineHookCenter.sol/VineHookCenter.json");
const VineAaveV3LendMainFactoryABI=require("../artifacts/contracts/hook/aave/VineAaveV3LendMainFactory.sol/VineAaveV3LendMainFactory.json");
const VineInL2LendFactoryABI=require("../artifacts/contracts/hook/aave/VineInL2LendFactory.sol/VineInL2LendFactory.json");
const VineInETHLendFactoryABI=require("../artifacts/contracts/hook/aave/VineInETHLendFactory.sol/VineInETHLendFactory.json");

//arb sepolia hook1: 0xD860F06364B112e40a012518c8591F21b216AB32
//op sepolia hook1: 0x614aa77CFA407fc9a11e8A1eF425aA6B99a3824D
//base sepolia hook1: 0xfE481a07148a5B8Ed745efbb05515E31fe72ce8A
//sepolia hook1: 0x748E01fCDF1A5010ee069FE069E3F81914f875FC

async function main() {
    const [owner, manager, testUser] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    console.log("manager:",manager.address);
    console.log("testUser:",testUser.address);
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log("Chain ID:", chainId);

    const arbGovernance="0x7fdF06F59a4Fa429c0Cee56d7009624bdF396f90";  //arb sepolia
    const opVineHookCenter="0x88105C02c8c803032D0092aD48373324d0559d48";  //op sepolia
    const baseVineHookCenter="0xE3940D2eeeb6920DB9565c4E3c5944888Ca93eab";  //base sepolia
    const sepoliaVineHookCenter="0xAa98C14031AF07647547bE1c7A24715EF0784472";  //sepolia

    const arbLendMainFactoryAddress = "0x4d354C90651B07Be872fC0205AA4D1CD7630e2e5";
    const opL2LendFactoryAddress = "0x83527e33C2F7D13DeBe578Ff0C926b121c46c7dc";
    const baseL2LendFactoryAddress = "0x0db31d955A6e6DB2F35BF5f27C5D913CdF3E6e4C";
    const sepoliaETHLendFactoryAddress = "0x50e8480F2Ca26371378F14673085D36730003600";

    if(chainId === 42161n || chainId === 421614n){
        const testUserGovernance=new ethers.Contract(arbGovernance, GovernanceABI.abi, testUser);
        const marketInfo = await testUserGovernance.getMarketInfo(1);
        console.log("marketInfo:", marketInfo);
        //30 days
        const register = await testUserGovernance.register(
            1000,
            43200n,
            129600n,
            testUser.address
        );
        await register.wait();
        console.log("register success");

        const testUserFactory=new ethers.Contract(arbLendMainFactoryAddress, VineAaveV3LendMainFactoryABI.abi, testUser);
        const createMainMarket = await testUserFactory.createMarket(manager.address, manager.address, "Vine USDC Share2", "V-USDC-SHARE2");
        await createMainMarket.wait();
        console.log("createMainMarket success");
        const getUserIdToHook=await testUserFactory.getUserIdToHook(1);
        console.log("Hook:", getUserIdToHook);
    }else if(chainId === 10n || chainId === 11155420n){
        const testUserGovernance=new ethers.Contract(opVineHookCenter, VineHookCenterABI.abi, testUser);
        const marketInfo = await testUserGovernance.getMarketInfo(1);
        console.log("marketInfo:", marketInfo);
        const register = await testUserGovernance.register();
        await register.wait();
        console.log("register success");

        const testUserFactory=new ethers.Contract(opL2LendFactoryAddress, VineInL2LendFactoryABI.abi, testUser);
        const createMainMarket = await testUserFactory.createMarket(manager.address, manager.address);
        await createMainMarket.wait();
        console.log("createMainMarket success");
        const getUserIdToHook=await testUserFactory.getUserIdToHook(1);

        console.log("Hook:", getUserIdToHook);
    }else if(chainId === 8453n || chainId === 84532n){
        const testUserGovernance=new ethers.Contract(baseVineHookCenter, VineHookCenterABI.abi, testUser);
        const register = await testUserGovernance.register();
        await register.wait();
        console.log("register success");

        const testUserFactory=new ethers.Contract(baseL2LendFactoryAddress, VineInL2LendFactoryABI.abi, testUser);
        const createMainMarket = await testUserFactory.createMarket(manager.address, manager.address);
        await createMainMarket.wait();
        console.log("createMainMarket success");
        const getUserIdToHook=await testUserFactory.getUserIdToHook(1);
        console.log("Hook:", getUserIdToHook);
    }else if(chainId === 1n || chainId === 11155111n){
        const testUserGovernance=new ethers.Contract(sepoliaVineHookCenter, VineHookCenterABI.abi, testUser);
        const register = await testUserGovernance.register();
        await register.wait();
        console.log("register success");

        const testUserFactory=new ethers.Contract(sepoliaETHLendFactoryAddress, VineInETHLendFactoryABI.abi, testUser);
        const govern=await testUserFactory.govern();
        console.log("govern:", govern);
        const createMainMarket = await testUserFactory.createMarket(manager.address, manager.address);
        await createMainMarket.wait();
        console.log("createMainMarket success");
        const getUserIdToHook=await testUserFactory.getUserIdToHook(1);
        console.log("Hook:", getUserIdToHook);
    }else{
        throw("Not chain id")
    }



}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});