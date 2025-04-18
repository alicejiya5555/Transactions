require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const ERC_API = process.env.ETHERSCAN_API_KEY;
const BSC_API = process.env.BSCSCAN_API_KEY;

// ERC20 & BEP20 token contracts
const USDT_ERC20 = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_BEP20 = '0x55d398326f99059fF775485246999027B3197955';

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim();

  // Check if it's a valid ETH/BSC wallet
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletRegex.test(text)) return;

  const address = text;

  try {
    const [ethBalance, ethTx, usdtERC, bnbBalance, usdtBEP] = await Promise.all([
      getEthBalance(address),
      getLatestEthTransaction(address),
      getERC20Balance(address, USDT_ERC20),
      getBnbBalance(address),
      getBEP20Balance(address, USDT_BEP20)
    ]);

    const message = `
🔔 *Wallet Update*

💼 Address: \`${address}\`

🟣 ETH: ${ethBalance}
💵 USDT (ERC20): ${usdtERC}
🟡 BNB: ${bnbBalance}
💵 USDT (BEP20): ${usdtBEP}

🔁 *New ETH Tx Detected:*
🆔 ${ethTx.hash}
📅 ${new Date(ethTx.time * 1000).toUTCString()}
    `;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "⚠️ Error fetching wallet data. Please try again.");
  }
});

// ETH balance
async function getEthBalance(address) {
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ERC_API}`;
  const res = await axios.get(url);
  return (parseFloat(res.data.result) / 1e18).toFixed(4);
}

// ETH latest transaction
async function getLatestEthTransaction(address) {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=1&sort=desc&apikey=${ERC_API}`;
  const res = await axios.get(url);
  const tx = res.data.result[0];
  return { hash: tx.hash, time: parseInt(tx.timeStamp) };
}

// ERC20 token balance
async function getERC20Balance(address, token) {
  const url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${token}&address=${address}&tag=latest&apikey=${ERC_API}`;
  const res = await axios.get(url);
  return (parseFloat(res.data.result) / 1e6).toFixed(2); // USDT decimals
}

// BNB balance
async function getBnbBalance(address) {
  const url = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${BSC_API}`;
  const res = await axios.get(url);
  return (parseFloat(res.data.result) / 1e18).toFixed(4);
}

// BEP20 token balance
async function getBEP20Balance(address, token) {
  const url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${token}&address=${address}&tag=latest&apikey=${BSC_API}`;
  const res = await axios.get(url);
  return (parseFloat(res.data.result) / 1e18).toFixed(2); // USDT on BEP20 has 18 decimals
}

