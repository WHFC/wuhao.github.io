const { ethers, network } = require("hardhat");
const initSqlJs = require('sql.js');
const fs = require('fs');
// const address = "0x0000000000000000000000000000000000000000";
// const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

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
        console.log(lostCount);
    }
    stmt = db.prepare("SELECT count(*) FROM WHNFT WHERE _to = '" + address + "';");
    var receiveCount = 0;
    while (stmt.step()) 
    {
        receiveCount = stmt.get();
        console.log(receiveCount);
    }
    console.log("address: ", address, " have NFT count: ", receiveCount - lostCount);
    return receiveCount - lostCount;
}

// GetNFTCount(address)