const { ethers, network } = require("hardhat");
const initSqlJs = require('sql.js');
const fs = require('fs');
// const address = "0x0000000000000000000000000000000000000000";
const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// 可以查询from == address(0)的数据库，得到总发行量，因为mint总是从address(0)，Transfer到某地址
// 通过to == address(0)的数据库条数，得到被销毁数量，因为burn总是从某地址Transfer到address(0)
// 在数据库中from == address(0)的条数 减去 to == address(0)的条数，能得到现存总量
// 某个地址在数据库中to的条数 - from的条数，即为其NFT持有量
async function GetNFTCount(address) {
    if (!fs.existsSync('./database/test.db'))
    {
        console.log("no sql db file");
        return 0;
    }
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync('./database/test.db');
    const db = new SQL.Database(filebuffer);
    let stmt = db.prepare("SELECT count(*) FROM WHNFT WHERE _from = '" + address + "';");
    var lostCount = 0;
    while (stmt.step()) 
    {
        lostCount = stmt.get();
        console.log("lost count ", lostCount);
    }
    stmt = db.prepare("SELECT count(*) FROM WHNFT WHERE _to = '" + address + "';");
    var receiveCount = 0;
    while (stmt.step()) 
    {
        receiveCount = stmt.get();
        console.log("receive count ", receiveCount);
    }
    console.log("address: ", address, " have NFT count: ", receiveCount - lostCount);
    return receiveCount - lostCount;
}

module.exports = {
    GetNFTCount
}

GetNFTCount(address)