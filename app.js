const contractAddress = "0xA7B42FD7264707caCf6D55de8e43Ee48BF4c0315"; // Replace with your deployed contract address
const contractABI = [
  [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "GivenLoan",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "member",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amountPaid",
          type: "uint256",
        },
      ],
      name: "LoanRepaid",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_member",
          type: "address",
        },
      ],
      name: "MemberAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "member",
          type: "address",
        },
      ],
      name: "MemberRemoved",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "_to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "PayoutMade",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "_from",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "SaveAdded",
      type: "event",
    },
    {
      inputs: [],
      name: "AllSavingsAndLoans",
      outputs: [
        {
          internalType: "uint256",
          name: "totalSaved",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "totalLoanedOut",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "availableFunds",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MySavingsAndLoan",
      outputs: [
        {
          internalType: "uint256",
          name: "savings",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "loan",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "lastLoanTime",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_member",
          type: "address",
        },
      ],
      name: "addMember",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "contractStartTime",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "distributeFunds",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "memberList",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "members",
      outputs: [
        {
          internalType: "bool",
          name: "isMember",
          type: "bool",
        },
        {
          internalType: "uint256",
          name: "totalSavings",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "loanAmount",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "lastLoanTimestamp",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "repayLoan",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "requestLoan",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "save",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "totalLoaned",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSavings",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
];

let provider;
let signer;
let MarygoroundContract;
// Function to connect wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const walletAddress = accounts[0];

      // Initialize signer and contract
      signer = await provider.getSigner();
      bookLibraryContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      document.getElementById(
        "walletAddress"
      ).innerText = `Connected: ${walletAddress}`;
      alert(`Wallet Connected: ${walletAddress}`);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet");
    }
  } else {
    alert("MetaMask not found. Please install it!");
  }
}

// Attach event listener to the button
document
  .getElementById("connectWallet")
  .addEventListener("click", connectWallet);
// Function to add a book
async function addBook() {
  if (!signer) {
    alert("Please connect your wallet first!");
    return;
  }
}
