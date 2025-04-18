require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const ERC20_USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const BEP20_USDT = '0x55d398326f99059fF775485246999027B3197955';

function isEthAddress(text) {
  return /^0x[a-fA-F0-9]{40}$/.test(text);
}

bot.on('text', async (ctx) => {
  const message = ctx.message.text.trim();
  if (!isEthAddress(message)) return;

  const address = message;
  try {
    // ETH balance
    const ethRes = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&apikey=${process.env.ETHERSCAN_KEY}`);
    const ethData = await ethRes.json();
    const eth = ethData.result / 1e18;

    // ERC20 USDT
    const ercRes = await fetch(`https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${ERC20_USDT}&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`);
    const ercData = await ercRes.json();
    const ercUSDT = ercData.result / 1e6;

    // BNB balance
    const bnbRes = await fetch(`https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${process.env.BSCSCAN_KEY}`);
    const bnbData = await bnbRes.json();
    const bnb = bnbData.result / 1e18;

    // BEP20 USDT
    const bepRes = await fetch(`https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${BEP20_USDT}&address=${address}&tag=latest&apikey=${process.env.BSCSCAN_KEY}`);
    const bepData = await bepRes.json();
    const bepUSDT = bepData.result / 1e18;

    const response = `🔔 *Wallet Update*

💼 Address: \`${address}\`

🟣 ETH: ${eth.toFixed(4)}
💵 USDT (ERC20): ${ercUSDT.toFixed(2)}
🟡 BNB: ${bnb.toFixed(4)}
💵 USDT (BEP20): ${bepUSDT.toFixed(2)}`;

    ctx.replyWithMarkdown(response);
  } catch (error) {
    console.error('Error:', error);
    ctx.reply('⚠️ Error fetching wallet details.');
  }
});

bot.launch();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000, () => console.log("Server running on port 3000"));
