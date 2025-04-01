const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const assert = require("minimalistic-assert");
const { constants } = require("@openzeppelin/test-helpers");

describe("ERC20 Token", function () {
  async function deploymentMethods() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ERC20Factory = await ethers.getContractFactory("ERC20");
    const ERC20 = await ERC20Factory.deploy("NasFinanialsCoin", "NFC", 18);
    await ERC20.waitForDeployment();
    return { ERC20, owner, addr1, addr2 };
  }

  describe("Token Deployment", function () {
    it("Sets name, token and decimal correctly", async function () {
      const { ERC20 } = await loadFixture(deploymentMethods);
      const name = await ERC20.name();
      const symbol = await ERC20.symbol();
      const decimals = await ERC20.decimals();

      assert(name == "NasFinanialsCoin");
      assert(symbol == "NFC");
      assert(decimals == 18);
    });

    it("It sets the total supply correctly", async function () {
      const { ERC20 } = await loadFixture(deploymentMethods);
      const TotalSupply = await ERC20.totalSupply();
      //assert(TotalSupply == 1000);
      expect(TotalSupply).to.be.equal(1000);
    });

    it("Ments the initial supply to the woner", async function () {
      const { ERC20, owner } = await loadFixture(deploymentMethods);
      const ownerBalance = await ERC20.balanceOf(owner.address);
      assert(ownerBalance == 1000);
    });
  });

  describe("Token Transfers", function () {
    it("Reverts if recepient is 0 address", async function () {
      let { ERC20, owner } = await loadFixture(deploymentMethods);
      expect(
        ERC20.connect(owner).transfer(constants.ZERO_ADDRESS, 200)
      ).to.be.revertedWith("recepient is 0 addes");
    });

    it("Reverts if sender has insufficient funds", async function () {
      let { ERC20, owner, addr1 } = await loadFixture(deploymentMethods);
      expect(ERC20.connect(owner).transfer(addr1, 2000)).to.be.revertedWith(
        "insufficient funds"
      );
    });

    it("Transfers correctly", async function () {
      let { ERC20, owner, addr1, addr2 } = await loadFixture(deploymentMethods);
      await ERC20.connect(owner).transfer(addr1, 200);
      await ERC20.connect(owner).transfer(addr2, 300);
      expect(await ERC20.balanceOf(owner)).to.be.equal(500);
      expect(await ERC20.balanceOf(addr1)).to.be.equal(200);
      expect(await ERC20.balanceOf(addr2)).to.be.equal(300);
    });
  });
  describe("Tokn approval and Transfer", function () {
    it("Reverts if spender is 0 address", async function () {
      let { ERC20, owner } = await loadFixture(deploymentMethods);
      expect(
        ERC20.connect(owner).transfer(constants.ZERO_ADDRESS, 200)
      ).to.be.revertedWith("spender is 0 addes");
    });

    it("Reverts if recepient is 0 address", async function () {
      let { ERC20, owner, addr1 } = await loadFixture(deploymentMethods);
      await ERC20.connect(owner).approve(addr1, 200);
      expect(
        ERC20.connect(addr1).transferFrom(owner, constants.ZERO_ADDRESS, 100)
      ).to.be.revertedWith("recepient is 0 address");
    });

    it("approves correctly", async function () {
      let { ERC20, owner, addr1 } = await loadFixture(deploymentMethods);
      await ERC20.connect(owner).approve(addr1, 200);
      const allowance = await ERC20.allowance(owner, addr1);
      assert(allowance == 200);
    });

    it("Reverts if amount is greater than allowance", async function () {
      let { ERC20, owner, addr1, addr2 } = await loadFixture(deploymentMethods);
      await ERC20.connect(owner).approve(addr1, 200);
      expect(
        ERC20.connect(addr1).transferFrom(owner, addr1, 500)
      ).to.be.revertedWith("amount exceeds allowance");
    });

    it("Approves and transfer correctly", async function () {
      let { ERC20, owner, addr1, addr2 } = await loadFixture(deploymentMethods);
      await ERC20.connect(owner).approve(addr1, 200);
      await ERC20.connect(addr1).transferFrom(owner, addr2, 100);
      expect(await ERC20.balanceOf(owner)).to.be.equal(900);
      expect(await ERC20.balanceOf(addr2)).to.be.equal(100);
      expect(await ERC20.allowance(owner, addr1)).to.be.equal(100);
    });
  });
});
