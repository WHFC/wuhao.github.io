
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

      account: null,
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
            let tx = await this.erc20Token.approve(this.vault.address, ethers.utils.parseUnits(this.deposit_amount, 18))
            await tx.wait();
            tx = await this.vault.deposit(ethers.utils.parseUnits(this.deposit_amount, 18))
            await tx.wait();
            this.vault_balance = ethers.utils.formatUnits(await this.vault.balanceOf(this.account), 18)
        }catch(error){
          console.log("deposit failed", error)
        }
    },

    async withdraw() {
        this.vault_balance = 0
        // try{
        //     let tx = await this.vault.withdraw(ethers.utils.parseUnits(this.withdraw_amount, 18))
        //     await tx.wait();
        //     this.vault_balance = ethers.utils.formatUnits(await this.vault.balanceOf(this.account), 18)
        // }catch(error){
        //   console.log("withdraw failed", error)
        // }
        this.vault.withdraw(ethers.utils.parseEther(this.withdraw_amount)).then((tx) => {
          this.provider.waitForTransaction(tx.hash).then((res) => {
            if (res.status == 1) {
              this.vault.balanceOf(this.account).then((r) => {
                this.vault_balance = ethers.utils.formatUnits(r, 18)
              })
            }
            else{
              console.log("withdraw failed");
            }
          })
        })
    },

    async getBalance() {
        try{
            this.vault_balance = ethers.utils.formatUnits(await this.vault.balanceOf(this.account), 18)
        }catch(error){
          console.log("get balance failed", error)
        }
    },

    async mint() {
        try{
            await this.erc20Token.mint(this.mint_address, ethers.utils.parseUnits(this.mint_amount, 18))
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
        <br /> 当前账号地址 : {{ account  }}
        <button @click="initAccount()"> 同步 </button>
        <br /> Token名称 : {{ name  }}
        <br /> Token符号 : {{  symbol }}
        <br /> Token精度 : {{  decimal }}
        <br /> Token发行量 : {{  supply }} ETH
        <br /> 我的余额 : {{ balance  }} ETH
        <button @click="getInfo()"> 查询 </button>
      </div>

      <div>
        <br />增发地址:
        <input type="text" v-model="mint_address" />
        <br />增发数量:
        <input type="text" v-model="mint_amount" /> ETH
        <br />
        <button @click="mint()"> 确认 </button>
      </div>

      <div >
        <br />转账到:
        <input type="text" v-model="recipient" />
        <br />转账金额
        <input type="text" v-model="amount" /> ETH
        <br />
        <button @click="transfer()"> 转账 </button>
      </div>

      <div>
        <br /> 银行余额 : {{ vault_balance  }} ETH
        <button @click="getBalance()"> 查询 </button>
      </div>

      <div >
        <br />存款:
        <input type="text" v-model="deposit_amount" /> ETH
        <br />
        <button @click="deposit()"> 存款 </button>
      </div>

      <div >
        <br />取款:
        <input type="text" v-model="withdraw_amount" /> ETH
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
