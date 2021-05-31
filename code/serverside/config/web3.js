const Web3 = require('web3')
const rpcURL = 'https://ropsten.infura.io/v3/28167840e91a44bd869d2cf550f8d612'
const web3 = new Web3(rpcURL)
const Tx = require('ethereumjs-tx').Transaction

const contractAddress = '0x9a8E3b87a339cA6348E31AB0863b3e4537383315'
const abi = require('./docuContractABI')
const contract = new web3.eth.Contract(abi, contractAddress)
module.exports = {
    web3,
    Tx,
    contract,
    contractAddress,
}