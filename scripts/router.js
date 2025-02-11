const hre = require("hardhat");

const GovernanceABI = require("../artifacts/contracts/core/Governance.sol/Governance.json");
const VineHookCenterABI = require("../artifacts/contracts/core/VineHookCenter.sol/VineHookCenter.json");
const VineRouter01ABI=require("../artifacts/contracts/helper/VineRouter01.sol/VineRouter01.json");
const VineAaveV3LendMainABI=require("../artifacts/contracts/hook/aave/VineAaveV3LendMain.sol/VineAaveV3LendMain.json");
const VineAaveV3LendMainFactoryABI=require("../artifacts/contracts/hook/aave/VineAaveV3LendMainFactory.sol/VineAaveV3LendMainFactory.json");
const ERC20ABI=require("../artifacts/contracts/TestToken.sol/TestToken.json");

const Set=require('../set.json');

//router: 0x33FeCACBcd38C2D87DFA5c77Ac3656464e69eDD9
async function main() {
    const [owner, manager] = await hre.ethers.getSigners();
    console.log("owner:", owner.address);
    console.log("manager:", manager.address);
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log("Chain ID:", chainId);

    const arbUSDC="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
    const aavePool="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff";
    const arbGovernance="0x7fdF06F59a4Fa429c0Cee56d7009624bdF396f90";
    const vineAaveV3LendMainFactoryAddress="0x4d354C90651B07Be872fC0205AA4D1CD7630e2e5";

    const Governance=new ethers.Contract(arbGovernance, GovernanceABI.abi, manager);
    const getMarketInfo=await Governance.getMarketInfo(0n);
    console.log("getMarketInfo:", getMarketInfo);

    // const vineRouter01 = await ethers.getContractFactory("VineRouter01");
    // const VineRouter01 = await vineRouter01.deploy(arbGovernance, arbUSDC);
    // const VineRouter01Address = await VineRouter01.target;
    // console.log("VineRouter01 Address:", VineRouter01Address);

    const VineRouter01Address="0x33FeCACBcd38C2D87DFA5c77Ac3656464e69eDD9";
    const VineRouter01=new ethers.Contract(VineRouter01Address, VineRouter01ABI.abi, owner);

    const vineAaveV3LendMainFactory=new ethers.Contract(vineAaveV3LendMainFactoryAddress, VineAaveV3LendMainFactoryABI.abi, owner);
    const market = await vineAaveV3LendMainFactory.getUserIdToHook(0n);
    console.log("Market:", market);

    const ERC20Contract=new ethers.Contract(arbUSDC, ERC20ABI.abi, owner);

    const allowance=await ERC20Contract.allowance(owner.address, VineRouter01Address);
    if(allowance<1000n){
        const approveERC20=await ERC20Contract.approve(VineRouter01Address, 1000000n);
        await approveERC20.wait();
        console.log("approve erc20 success");
    };

    const deposite=await VineRouter01.deposite(
        100n,
        market,
        aavePool
    );
    const depositeTx=await deposite.wait();
    console.log("deposite success:", depositeTx);

    const getUserShareTokenBalance=await VineRouter01.getUserTokenBalance(market, owner.address);
    console.log("getUserShareTokenBalance:", getUserShareTokenBalance);

    const getUserSupplyToHookAmount=await VineRouter01.getUserSupplyToHookAmount(market, owner.address);
    console.log("getUserSupplyToHookAmount:", getUserSupplyToHookAmount);

    const getMarketTotalSupply=await VineRouter01.getMarketTotalSupply(market);
    console.log("getMarketTotalSupply:", getMarketTotalSupply);

    const getMarketTotalDepositeAmount=await VineRouter01.getMarketTotalDepositeAmount(market);
    console.log("getMarketTotalDepositeAmount:", getMarketTotalDepositeAmount);

    const getUserFinallyAmount=await VineRouter01.getUserFinallyAmount(0n, VineRouter01Address);
    console.log("getUserFinallyAmount:", getUserFinallyAmount);

    const getFeeData=await VineRouter01.getFeeData(0n);
    console.log("getFeeData:", getFeeData);

    const transferUsdc = await ERC20Contract.transfer(market, 50000n);
    await transferUsdc.wait();
    console.log("transferUsdc success");

    const managerMarketContract = new ethers.Contract(market, VineAaveV3LendMainABI.abi, manager);
    const marketContract = new ethers.Contract(market, VineAaveV3LendMainABI.abi, owner);

    //update
    const updateFinallyAmount=await managerMarketContract.updateFinallyAmount(arbUSDC);
    const updateFinallyAmountTx=await updateFinallyAmount.wait();
    console.log("updateFinallyAmount success:", updateFinallyAmountTx);

    const getUserTokenBalance=await VineRouter01.getUserTokenBalance(arbUSDC, market);
    console.log("getUserTokenBalance:", getUserTokenBalance);

    const withdraw =await marketContract.withdraw(
        arbUSDC
    );
    const withdrawTx=await withdraw.wait();
    console.log("withdraw success:", withdrawTx);



}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});