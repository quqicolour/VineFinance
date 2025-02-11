
const hre = require("hardhat");

const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");
const GovernanceABI=require("../artifacts/contracts/core/Governance.sol/Governance.json");
const VineAaveV3LendMainFactoryABI=require("../artifacts/contracts/hook/aave/VineAaveV3LendMainFactory.sol/VineAaveV3LendMainFactory.json");
const VineAaveV3LendMainABI=require("../artifacts/contracts/hook/aave/VineAaveV3LendMain.sol/VineAaveV3LendMain.json");

async function main() {
    const [owner, manager] = await hre.ethers.getSigners();
    console.log("owner:",owner.address);
    console.log("manager:",manager.address);
    const provider = ethers.provider;

    const usdc="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
    const aavePool="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff";
    const GovernanceAddress = "0x72ba808fa4DeC8bDCBc914335fB4aEcAe2bc6351";
    const Governance = new ethers.Contract(GovernanceAddress, GovernanceABI.abi, manager);

    const getMarketInfo=await Governance.getMarketInfo(0n);
    console.log("getMarketInfo:", getMarketInfo);

    const ERC20Contract=new ethers.Contract(usdc, ERC20ABI.abi, owner);

    const vineAaveV3LendMainFactoryAddress="0x35c1096B64c83f5DaF4FCde2bb2011b95aeDAeCe";
    const vineAaveV3LendMainFactory=new ethers.Contract(vineAaveV3LendMainFactoryAddress, VineAaveV3LendMainFactoryABI.abi, owner);
    const market = await vineAaveV3LendMainFactory.getUserIdToHook(1n);
    console.log("Market:", market);
    
    const Market=new ethers.Contract(market,VineAaveV3LendMainABI.abi,owner);

    const allowance=await ERC20Contract.allowance(owner.address, market);
    if(allowance<1000n){
        const approveERC20=await ERC20Contract.approve(market, 1000n);
        await approveERC20.wait();
        console.log("approve erc20 success");
    };

    const deposite=await Market.deposite(
        1000n,
        market,
        aavePool
    );
    const depositeTx=await deposite.wait();
    if(depositeTx.status === 1){
        console.log("depositeTx:", depositeTx);
    }else{
        console.log("deposite fail");
    }

    const getUserSupply=await Market.getUserSupply(owner.address);
    console.log("getUserSupply:", getUserSupply);



}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});