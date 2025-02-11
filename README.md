# VineFinance
🌿 VineFinance - modular, decentralized revenue marketplace protocol.
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.12.0-yellow)](https://hardhat.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## ✨ Intro
Vine finance is an innovative modular DeFi revenue protocol that enables seamless integration with multiple DeFi protocols on different blockchains through powerful cross-chain technology. In the EVM ecosystem, Vine supports deep docking with mainstream Defi protocols such as Aave V3, Compound, Uniswap V3, Uniswap V2, Morpho, Gains, and Aerodrome. In the Solana ecosystem, it integrates with premium protocols such as Raydium, Jup and Kamino; In the Move ecosystem, compatibility with protocols such as Cetus and Navi is supported.

The unique strength of Vine finance is that it empowers users with flexibility and creativity. Users can create a personalized investment strategy based on their own needs, or choose to follow the curator's strategy mix. With facilities that support cross-chain communication, users can capture higher returns on other chains on a single chain without having to migrate assets to other chains, significantly increasing the efficiency of capital utilization

## ✨ Why use vine?
There are already thousands of chains on the blockchain, but chains are independent of each other, resulting in a large amount of capital dispersion, and many of these funds are used in Defi. For example: Aave V3, ordinary users want to go to Defi pledge farming, but because there are different chains of Aave V3, and these funds are not interworking, the benefits between different chains are different, which causes users want to deposit into the protocol, but can not get the high-yield part of the protocol, especially on the Ethereum main network. The dreaded high Gas prices are terrifying to the average retail investor. If a user goes through Vine, then he can capture, for example, Ethereum's current highest pledge yield on a cheap layer2.

- **多策略资产管理**  
  支持流动性挖矿、套利交易、杠杆 farming 等多种 DeFi 策略组合

- **跨链互操作性**  
  兼容 Ethereum、BNB Chain、Polygon 等多链生态

- **智能风控机制**  
  实时监控的自动止损系统和资金安全预警模块

- **DAO 治理**  
  VE代币持有者可通过投票参与协议参数调整和新功能提案

- **收益增强工具**  
  内置自动复投、收益再平衡和 Gas 优化机制

## Become a curator
Users can register as a curator directly through Vine's Governance and then choose trusted factory modules to create their own policies.

### 前置要求
- Node.js v18+
- Yarn 1.22+
- Git 2.30+

### 本地部署
```bash
git clone https://github.com/quqicolour/VineFinance.git
cd VineFinance
npm install
set .env
npx hardhat run scripts/test_deploy.js --network arb_sepolia
npx hardhat run scripts/test_deploy.js --network op_sepolia
npx hardhat run scripts/test_deploy.js --network base_sepolia
npx hardhat run scripts/test_deploy.js --network sepolia
npx hardhat run scripts/deploy_market.js --network arb_sepolia
npx hardhat run scripts/deploy_market.js --network op_sepolia
npx hardhat run scripts/deploy_market.js --network base_sepolia
npx hardhat run scripts/deploy_market.js --network sepolia
npx hardhat run scripts/set_cctp.js --network arb_sepolia
npx hardhat run scripts/set_cctp.js --network op_sepolia
npx hardhat run scripts/set_cctp.js --network base_sepolia
npx hardhat run scripts/set_cctp.js --network sepolia
npx hardhat run scripts/set_valid_hooks.js --network arb_sepolia
npx hardhat run scripts/set_valid_hooks.js --network op_sepolia
npx hardhat run scripts/set_valid_hooks.js --network base_sepolia
npx hardhat run scripts/set_valid_hooks.js --network sepolia
```

## ✨ 技术架构

