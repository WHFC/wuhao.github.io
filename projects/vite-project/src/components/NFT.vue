
<script>
import { ethers } from 'ethers'

import erc721Addr from '../../../deployments/dev/WHERC721Token.json'
import erc721Abi from '../../../artifacts/contracts/WHERC721Token/WHERC721Token.sol/WHERC721Token.json'
// import {GetNFTCount} from '../../../actions/GetNFTCount.js'
import { writeAddr } from '../../../actions/artifact_log'
// import sql from 'sql.js';
// // import fs from '../../../node_modules/fs-extra/lib/fs';

// async function GetNFTCount(address) {
//     // if (!this.existsSync("./database/test.db"))
//     // {
//     //     console.log("no sql db file");
//     //     return 0;
//     // }
//     const SQL = await sql.initSqlJs();
//     const filebuffer = this.loadFile('../../../database/test.db')
//     const db = new SQL.Database(filebuffer);
//     let stmt = db.prepare("SELECT count(*) FROM WHNFT WHERE _from = '" + address + "';");
//     var lostCount = 0;
//     while (stmt.step()) 
//     {
//         lostCount = stmt.get();
//         console.log(lostCount);
//     }
//     stmt = db.prepare("SELECT count(*) FROM WHNFT WHERE _to = '" + address + "';");
//     var receiveCount = 0;
//     while (stmt.step()) 
//     {
//         receiveCount = stmt.get();
//         console.log(receiveCount);
//     }
//     console.log("address: ", address, " have NFT count: ", receiveCount - lostCount);
//     return receiveCount - lostCount;
// }

export default {

  name: 'nft',

  data() {
    return {
      account: null,
      recipient: null,
      tokenId: null,
      balance: null,

      name: null,
      decimal: null,
      symbol: null,
      supply: null,

      mint_address: null,
      holder: null,
      holded_count: null,
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
      this.erc721Token = new ethers.Contract(erc721Addr.address, 
        erc721Abi.abi, this.signer);

    }, 

    getInfo() {
      this.erc721Token.name().then((r) => {
        this.name = r;
      })
      this.erc721Token.symbol().then((r) => {
        this.symbol = r;
      })
      this.erc721Token.totalSupply().then((r) => {
        this.supply = r;
      })

      this.erc721Token.balanceOf(this.account).then((r) => {
        this.balance = r;
      })
      
    },

    transfer() {
      this.erc721Token.transferFrom(this.account, this.recipient, this.tokenId).then((r) => {
        console.log(r);  // 返回值不是true
        this.getInfo();
      })
    },

    async getNFTCount() {
      this.holded_count = await GetNFTCount(this.holder);
    },

    async mint() {
        try{
            await this.erc721Token.mint(this.mint_address)
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
        <br /> NFT发行量 : {{  supply }} 个
        <br /> 我的NFT持有量 : {{ balance  }} 个
        <button @click="getInfo()"> 查询 </button>
      </div>

      <div>
        <br />增发地址:
        <input type="text" v-model="mint_address" />
        <br />
        <button @click="mint()"> 确认 </button>
      </div>

      <div >
        <br />转账到:
        <input type="text" v-model="recipient" />
        <br />NFTID
        <input type="text" v-model="tokenId" />
        <br />
        <button @click="transfer()"> 转账 </button>
      </div>

      <div >
        <br />查询持有量:
        <input type="text" v-model="holder" />
        <br /> NFT数量 : {{ holded_count  }}
        <button @click="getNFTCount()"> 查询 </button>
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
