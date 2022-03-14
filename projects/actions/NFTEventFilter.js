const { ethers, network } = require("hardhat");
const initSqlJs = require('sql.js');
const fs = require('fs');

const depolyedAddr = require(`../deployments/${network.name}/WHERC721Token.json`)

async function parseTransferEvent(event, db) {
    const TransferEvent = new ethers.utils.Interface(["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"]);
    let decodedData = TransferEvent.parseLog(event);
    console.log("from:" + decodedData.args.from);
    console.log("to:" + decodedData.args.to);
    console.log("tokenId:" + decodedData.args.tokenId.toString());
    let sqlstr = "INSERT INTO WHNFT VALUES ('" + decodedData.args.from + "', '" + decodedData.args.to + "', " + decodedData.args.tokenId + ");"
    db.exec(sqlstr);
    const data = db.export();
    const buffer = Buffer.from(data);
    await fs.writeFileSync("./database/test.db", buffer);
}

async function main() {
    const SQL = await initSqlJs();
    const filebuffer = fs.existsSync('./database/test.db') ? fs.readFileSync('./database/test.db') : "";
    const db = new SQL.Database(filebuffer);
    let sqlstr = "CREATE TABLE IF NOT EXISTS WHNFT (_from char, _to char, tokenId int);";
    db.run(sqlstr);
    let [owner, second] = await ethers.getSigners();
    let token = await ethers.getContractAt("WHERC721Token",
        depolyedAddr.address,
        owner);

    let filter = token.filters.Transfer()

    ethers.provider.on(filter, (event) => {
        console.log(event)
        parseTransferEvent(event, db);
    })
    
    console.log("event filter is running");
}

main()