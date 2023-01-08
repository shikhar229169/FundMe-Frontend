// require doen't work in front-end
import { ethers } from "./ethers-5.6.esm.min.js";
import { contractAddress, abi } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const withdrawButton = document.getElementById("withdrawButton");
const balanceButton = document.getElementById("balanceButton");

connectButton.onclick = connect;
fundButton.onclick = fund;
withdrawButton.onclick = withdraw;
balanceButton.onclick = getBalance;

// const inputEthAmt = document.getElementById("ethAmt");
// inputEthAmt.onchange = checkNum;

// function checkNum() {
//     const value = inputEthAmt.value.toString();
//     if (value=="0") {
//         document.getElementById("fundResponse").innerHTML = "Please enter Amt";
//     } 
//     else {
//         document.getElementById("fundResponse").innerHTML = "";
//     }
// }

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

async function getBalance() {
    if (typeof window.ethereum!=="undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(contractAddress);
        document.getElementById("balanceButtonResponse").innerHTML = `${balance/1e18} ETH`;
    }
}

async function fund() {
    if (typeof window.ethereum !== "undefined") {
        const inputEthAmt = document.getElementById("ethAmt");
        let value = inputEthAmt.value.toString();
        if (value=="") {
            document.getElementById("fundResponse").innerHTML = "Please enter Amt";
            return;
        }
        document.getElementById("fundResponse").innerHTML = "Funding...";
        const ethAmt = ethers.utils.parseEther(value);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const fundMe = new ethers.Contract(contractAddress, abi, signer);

        const before = await fundMe.provider.getBalance(contractAddress);
        try {
            const fundResponse = await fundMe.fund({value: ethAmt});
            await hashMining(fundResponse, provider);

            const after = await fundMe.provider.getBalance(fundMe.address);
            console.log("Hooray! Done");
            document.getElementById("fundResponse").innerHTML = `Thanks! You have successfully funded: ${(after-before)/1e18} ETH`;
        }
        catch (e) {
            if (e.message.toLowerCase().includes("user denied transaction")) {
                document.getElementById("fundResponse").innerHTML = "Txn was rejected by user";
            }
            else if (e.data.message.toLowerCase().includes("amount should be atleast 1 eth")) {
                document.getElementById("fundResponse").innerHTML = "Amount should be atleast 1 eth";
            }
            else {
                document.getElementById("fundResponse").innerHTML = "Txn was terminated due to an error";
                console.log(e);
            }
        }   
    }
    document.getElementById("ethAmt").value = "";
}

async function withdraw() {
    const withdrawMessage = document.getElementById("withdrawMessage");
    if (typeof window.ethereum !== "undefined") {
        withdrawMessage.innerHTML = "Withdrawing....";
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const fundMe = new ethers.Contract(contractAddress, abi, signer);
        try {
            const before = await fundMe.provider.getBalance(fundMe.address);
            if (before=="0") {
                withdrawMessage.innerHTML = "The Amt is 0 ETH";
                return;
            }
            const txnResponse = await fundMe.withdraw();
            await hashMining(txnResponse, provider);
            const after = await fundMe.provider.getBalance(fundMe.address);
            console.log(`Amt withdrawn: ${(before-after)/1e18} ETH`);
            withdrawMessage.innerHTML = "Successfully Withdrawn";
        }
        catch(e) {
            withdrawMessage.innerHTML = "Ah-Snap! Caught an error";
            console.log(e);
        }
    }
    else {
        withdrawMessage.innerHTML = "Uh-oh! Unable to detect Metamask";
    }

}

function hashMining(txnResponse, provider) {
    console.log(`Mining ${txnResponse.hash} ....`);
    return new Promise((resolve, reject) => {
        provider.once(txnResponse.hash, (txnReceipt) => {
            console.log(`Total Confirmarions: ${txnReceipt.confirmations}`);
            resolve();
        });
    });
}