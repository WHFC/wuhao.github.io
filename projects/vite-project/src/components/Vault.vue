
<script>
import { ethers } from 'ethers'

import erc20Addr from '../../../deployments/dev/WHERC20Token.json'
import erc20Abi from '../../../artifacts/contracts/WHERC20Token/WHERC20Token.sol/WHERC20Token.json'

import vaultAddr from '../../../deployments/dev/vault.json'
import vaultAbi from '../../../artifacts/contracts/WHERC20Token/vault.sol/vault.json'

export default {

  name: 'erc20',

  data() {
    return {

      recipient: null,
      amount: null,
      balance: null,

      name: null,
      decimal: null,
      symbol: null,
      supply: null,

      stakeAmount: null,
      vault_balance: null,
      deposit_amount: null,
      withdraw_amount: null,
      mint_address: null,
      mint_amount: null,

    }
  },

  async created() {
    await this.initAccount()
    this.initContract()
    this.getInfo();
    this.getNonce();
  },

  methods: {
    async initAccount(){
      if(window.ethereum) {
        console.log("initAccount");
        try{
          this.accounts = await window.ethereum.enable()
          console.log("accounts:" + this.accounts);
          this.account = this.accounts[0];
          this.currProvider = window.ethereum;
          this.provider = new ethers.providers.Web3Provider(window.ethereum);

          this.signer = this.provider.getSigner()
          let network = await this.provider.getNetwork()
          this.chainId = network.chainId;
          console.log("chainId:", this.chainId);

        } catch(error){
          console.log("User denied account access", error)
        }
      }else{
        console.log("Need install MetaMask")
      }
    },

    async initContract() {
      this.erc20Token = new ethers.Contract(erc20Addr.address, 
        erc20Abi.abi, this.signer);

      this.vault = new ethers.Contract(vaultAddr.address, 
        vaultAbi.abi, this.signer);

    }, 

    getInfo() {
      this.erc20Token.name().then((r) => {
        this.name = r;
      })
      this.erc20Token.decimals().then((r) => {
        this.decimal = r;
      })
      this.erc20Token.symbol().then((r) => {
        this.symbol = r;
      })
      this.erc20Token.totalSupply().then((r) => {
        this.supply = ethers.utils.formatUnits(r, 18);
      })

      this.erc20Token.balanceOf(this.account).then((r) => {
        this.balance = ethers.utils.formatUnits(r, 18);
      })
      
    },

    transfer() {
      let amount = ethers.utils.parseUnits(this.amount, 18);
      this.erc20Token.transfer(this.recipient, amount).then((r) => {
        console.log(r);  // 返回值不是true
        this.getInfo();
      })
    },

    async deposit() {
        try{
            await this.erc20Token.approve(this.vault.address, this.deposit_amount)
            await this.vault.deposit(this.deposit_amount)
        }catch(error){
          console.log("deposit failed", error)
        }
    },

    async withdraw() {
        try{
            await this.vault.withdraw(this.withdraw_amount)
        }catch(error){
          console.log("withdraw failed", error)
        }
    },

    async getBalance() {
        try{
            this.vault_balance = await this.vault.balanceOf(this.account)
        }catch(error){
          console.log("get balance failed", error)
        }
    },

    async mint() {
        try{
            await this.erc20Token.mint(this.mint_address, this.mint_amount)
        }catch(error){
          console.log("mint failed", error)
        }
    }
  }
}


</script>

<template>
  <div >

      <div>
        <br /> Token名称 : {{ name  }}
        <br /> Token符号 : {{  symbol }}
        <br /> Token精度 : {{  decimal }}
        <br /> Token发行量 : {{  supply }}
        <br /> 我的余额 : {{ balance  }}
        <button @click="getInfo()"> 查询 </button>
      </div>

      <div>
        <br />增发地址:
        <input type="text" v-model="mint_address" />
        <br />增发数量:
        <input type="text" v-model="mint_amount" />
        <br />
        <button @click="mint()"> 确认 </button>
      </div>

      <div >
        <br />转账到:
        <input type="text" v-model="recipient" />
        <br />转账金额
        <input type="text" v-model="amount" />
        <br />
        <button @click="transfer()"> 转账 </button>
      </div>

      <div>
        <br /> 银行余额 : {{ vault_balance  }}
        <button @click="getBalance()"> 查询 </button>
      </div>

      <div >
        <br />存款:
        <input type="text" v-model="deposit_amount" />
        <br />
        <button @click="deposit()"> 存款 </button>
      </div>

      <div >
        <br />取款:
        <input type="text" v-model="withdraw_amount" />
        <br />
        <button @click="withdraw()"> 取款 </button>
      </div>

  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

div {
  font-size: 1.2rem;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
