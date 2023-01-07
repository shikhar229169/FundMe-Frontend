// require doen't work in front-end
import { ethers } from "./ethers-5.6.esm.min.js";
import { contractAddress, abi } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");

connectButton.onclick = connect;
fundButton.onclick = fund;

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        document.getElementById("connectButtonFlag").innerHTML = "Connecting... Please be patient";
        console.log("Ah! Matamask detected");
        try {
            const res = await window.ethereum.request({method: "eth_requestAccounts"});            
            document.getElementById("connectButtonFlag").innerHTML = "Connected!";
        }
        catch (e) {
            document.getElementById("connectButtonFlag").innerHTML = "Uh-Oh! Unable to Connect.";
            console.log(e);
        }
    }
    else {
        document.getElementById("connectButtonFlag").innerHTML = "Can't Reach Matamask";
    }
}

async function fund() {
    if (typeof window.ethereum !== "undefined") {
        document.getElementById("fundResponse").innerHTML = "Funding...";
        const ethAmt = ethers.utils.parseEther("1");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const fundMe = new ethers.Contract(contractAddress, abi, signer);

        const before = await fundMe.provider.getBalance(contractAddress);

        const fundResponse = await fundMe.fund({value: ethAmt});
        await hashMining(fundResponse, provider);

        const after = await fundMe.provider.getBalance(fundMe.address);
        console.log("Hooray! Done");
        document.getElementById("fundResponse").innerHTML = `Thanks! You have successfully funded: ${(after-before)/1e18} ETH`;
    }
}

function hashMining(fundResponse, provider) {
    console.log(`Mining ${fundResponse.hash} ....`);
    return new Promise((resolve, reject) => {
        provider.once(fundResponse.hash, (fundReceipt) => {
            console.log(`Total: ${fundReceipt.confirmations}`);
            resolve();
        });
    });
}