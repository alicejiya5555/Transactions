require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const getEthBalance = async (address) => {
  const url = \`https://api.etherscan.io/api?module=account&action=balance&address=\${address}&tag=latest&apikey=\${process.env.ETHERSCAN_API_KEY}\`;
  const res = await axios.get(url);
  return parseFloat(res.data.result) / 1e18;
};

const getERC20USDT = async (address) => {
  const url = \`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&address=\${address}&tag=latest&apikey=\${process.env.ETHERSCAN_API_KEY}\`;
  const res = await axios.get(url);
  return parseFloat(res.data.result) / 1e6;
};

const getBnbBalance = async (address) => {
  const url = \`https://api.bscscan.com/api?module=account&action=balance&address=\${address}&apikey=\${process.env.BSCSCAN_API_KEY}\`;
  const res = await axios.get(url);
  return parseFloat(res.data.result) / 1e18;
};

const getBEP20USDT = async (address) => {
  const url = \`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=0x55d398326f99059fF775485246999027B3197955&address=\${address}&tag=latest&apikey=\${process.env.BSCSCAN_API_KEY}\`;
  const res = await axios.get(url);
  return parseFloat(res.data.result) / 1e18;
};

const getLatestEthTx = async (address) => {
  const url = \`https://api.etherscan.io/api?module=account&action=txlist&address=\${address}&sort=desc&apikey=\${process.env.ETHERSCAN_API_KEY}\`;
  const res = await axios.get(url);
  return res.data.result && res.data.result[0];
};

bot.on("message", async (msg) => {
  const address = msg.text.trim();
  const chatId = msg.chat.id;

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return;

  try {
    const [eth, ercUsdt, bnb, bepUsdt, tx] = await Promise.all([
      getEthBalance(address),
      getERC20USDT(address),
      getBnbBalance(address),
      getBEP20USDT(address),
      getLatestEthTx(address)
    ]);

    const time = tx ? new Date(tx.timeStamp * 1000).toUTCString() : "N/A";
    const txHash = tx ? tx.hash : "N/A";

    const message = \`🔔 Wallet Update

💼 Address: \${address}

🟣 ETH: \${eth.toFixed(4)}
💵 USDT (ERC20): \${ercUsdt.toFixed(2)}
🟡 BNB: \${bnb.toFixed(4)}
💵 USDT (BEP20): \${bepUsdt.toFixed(2)}

🔁 New ETH Tx Detected:
🆔 \${txHash}
📅 \${time}
\`;

    bot.sendMessage(chatId, message);
  } catch (err) {
    bot.sendMessage(chatId, "❌ Error fetching wallet details.");
    console.error(err.message);
  }
});

