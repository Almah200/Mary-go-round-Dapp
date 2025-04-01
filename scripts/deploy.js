const hre = require("hardhat");

async function main() {
  const Marygoroundhourtest = await hre.ethers.getContractFactory(
    "Marygoroundhourtest"
  );
  const marygoroundhourtest = await Marygoroundhourtest.deploy();

  console.log("Contract Address: ", await marygoroundhourtest.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
