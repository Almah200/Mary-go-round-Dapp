const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { member } = require("fp-ts/lib/Map");

describe("Marygoround Smart Contract", function () {
  let Marygoround,
    owner,
    addr1,
    addr2,
    addr3,
    addr4,
    addr5,
    addr6,
    addr7,
    addr8,
    addr9,
    addr10;

  async function deployContractFixture() {
    [
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
      addr7,
      addr8,
      addr9,
      addr10,
    ] = await ethers.getSigners();
    const MarygoroundFactory = await ethers.getContractFactory("Marygoround");
    const Marygoround = await MarygoroundFactory.deploy();
    await Marygoround.waitForDeployment();
    return {
      Marygoround,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
      addr7,
      addr8,
      addr9,
      addr10,
    };
  }

  describe("Contract Deployment", function () {
    beforeEach(async function () {
      ({ Marygoround, owner } = await loadFixture(deployContractFixture));
    });

    it("should deploy and set owner correctly", async function () {
      expect(await Marygoround.owner()).to.equal(owner.address);
    });
  });

  describe("Member Management", function () {
    beforeEach(async function () {
      ({
        Marygoround,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      } = await loadFixture(deployContractFixture));

      // Add members
      const members = [
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      ];
      for (const member of members) {
        await Marygoround.connect(owner).addMember(member.address);
      }
    });

    it("should allow the owner to add members", async function () {
      for (const member of [
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      ]) {
        const memberStatus = await Marygoround.members(member.address);
        expect(memberStatus.isMember).to.be.true;
      }
    });

    it("should prevent non-owners from adding members", async function () {
      await expect(
        Marygoround.connect(addr1).addMember(addr9.address)
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("should prevent adding duplicate members", async function () {
      await expect(
        Marygoround.connect(owner).addMember(addr1.address)
      ).to.be.revertedWith("Member already exist");
    });
  });

  describe("Saving", function () {
    beforeEach(async function () {
      ({
        Marygoround,
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      } = await loadFixture(deployContractFixture));

      // Add members first (dependency)
      const members = [
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      ];
      for (const member of members) {
        await Marygoround.connect(owner).addMember(member.address);
      }
    });

    it("should not allow depositing zero ETH", async function () {
      await expect(
        Marygoround.connect(owner).save({ value: ethers.parseEther("0") })
      ).to.be.revertedWith("Must deposit some ETH");
    });

    it("should allow members to deposit savings", async function () {
      const amounts = [
        ethers.parseEther("1.0"),
        ethers.parseEther("2.0"),
        ethers.parseEther("3.0"),
        ethers.parseEther("4.0"),
        ethers.parseEther("5.0"),
        ethers.parseEther("6.0"),
        ethers.parseEther("7.0"),
        ethers.parseEther("8.0"),
        ethers.parseEther("9.0"),
        ethers.parseEther("10.0"),
      ];

      const members = [
        owner,
        addr1,
        addr2,
        addr3,
        addr4,
        addr5,
        addr6,
        addr7,
        addr8,
        addr9,
      ];

      for (let i = 0; i < members.length; i++) {
        await expect(
          Marygoround.connect(members[i]).save({ value: amounts[i] })
        )
          .to.emit(Marygoround, "SaveAdded")
          .withArgs(members[i].address, amounts[i]);

        const memberData = await Marygoround.members(members[i].address);
        expect(memberData.totalSavings).to.equal(amounts[i]);
      }

      const totalSavings = await Marygoround.totalSavings();
      const expectedTotal = amounts.reduce(
        (sum, amt) => sum + amt,
        ethers.parseEther("0")
      );
      expect(totalSavings).to.equal(expectedTotal);

      //viewAllSavingsAndLoans

      const [totalSaved, totalLoanedOut, availableFunds] =
        await Marygoround.AllSavingsAndLoans();

      expect(availableFunds).to.equal(totalSaved - totalLoanedOut);
    });

    it("should prevent taking loan with zero savings", async function () {
      const Excedloan = ethers.parseEther("20.0");
      await expect(
        Marygoround.connect(addr1).requestLoan(Excedloan)
      ).to.be.revertedWith("No savings available");
    });

    it("should prevent loans exceeding allowed limit", async function () {
      // Ensure deposits are made first
      const depositAmount = ethers.parseEther("2.0");
      await Marygoround.connect(addr1).save({ value: depositAmount });

      // Verify the deposit was recorded
      const memberData = await Marygoround.members(addr1.address);
      expect(memberData.totalSavings).to.equal(depositAmount);

      const Excedloan = ethers.parseEther("20.0");
      await expect(
        Marygoround.connect(addr1).requestLoan(Excedloan)
      ).to.be.revertedWith("Loan exceeds allowed limit");
    });

    it("should allow a member to take a loan based on their savings", async function () {
      const depositAmounts = [
        ethers.parseEther("10.0"),
        ethers.parseEther("15.0"),
        ethers.parseEther("30.0"),
        ethers.parseEther("1.0"),
      ];

      const members = [addr1, addr2, addr3, addr4];

      for (let i = 0; i < members.length; i++) {
        await expect(
          Marygoround.connect(members[i]).save({ value: depositAmounts[i] })
        )
          .to.emit(Marygoround, "SaveAdded")
          .withArgs(members[i].address, depositAmounts[i]);

        // Verify each deposit was recorded correctly
        const memberData = await Marygoround.members(members[i].address);
        expect(memberData.totalSavings).to.equal(depositAmounts[i]);
      }

      // Calculate the expected total savings
      const expectedTotal = depositAmounts.reduce(
        (sum, amt) => sum + amt,
        ethers.parseEther("0")
      );

      // Verify total savings in the contract
      const totalSavings = await Marygoround.totalSavings();
      expect(totalSavings).to.equal(expectedTotal);

      // Request a loan and repay 10%
      const loanAmount10 = ethers.parseEther("20.0");
      await expect(Marygoround.connect(addr1).requestLoan(loanAmount10))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr1.address, loanAmount10);

      const MemberData10 = await Marygoround.members(addr1.address);
      expect(MemberData10.loanAmount).to.equal(loanAmount10);

      const interest10 = ethers.parseEther("2.0"); // 10% interest
      const totalRepayment = loanAmount10 + interest10;
      await time.increase(30 * 24 * 60 * 60); // Move time forward 1 month

      await expect(
        Marygoround.connect(addr1).repayLoan({ value: totalRepayment })
      )
        .to.emit(Marygoround, "LoanRepaid")
        .withArgs(addr1.address, totalRepayment);

      const memberData10 = await Marygoround.members(addr1.address);
      expect(memberData10.loanAmount).to.equal(0);

      // // Request loan and repay 20%

      const loanAmount20 = ethers.parseEther("30.0");
      await expect(Marygoround.connect(addr2).requestLoan(loanAmount20))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr2.address, loanAmount20);

      const MemberData20 = await Marygoround.members(addr2.address);
      expect(MemberData20.loanAmount).to.equal(loanAmount20);

      // Loan repayment
      const interest20 = ethers.parseEther("6.0"); // 20% interest
      const totalRepayment20 = loanAmount20 + interest20;
      await time.increase(60 * 24 * 60 * 60); // Move time forward 1 month

      await expect(
        Marygoround.connect(addr2).repayLoan({ value: totalRepayment20 })
      )
        .to.emit(Marygoround, "LoanRepaid")
        .withArgs(addr2.address, totalRepayment20);

      const memberData20 = await Marygoround.members(addr2.address);
      expect(memberData20.loanAmount).to.equal(0);

      // Requesting Higher than available
      const LoanNobal = ethers.parseEther("60.0");

      await expect(
        Marygoround.connect(addr3).requestLoan(LoanNobal)
      ).to.be.revertedWith("No sufficient amount in the account currently");

      // Request loana and pay 30%

      const loanAmount30 = ethers.parseEther("30.0");
      await expect(Marygoround.connect(addr2).requestLoan(loanAmount30))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr2.address, loanAmount30);

      const MemberData30 = await Marygoround.members(addr2.address);
      expect(MemberData30.loanAmount).to.equal(loanAmount30);

      // Loan repayment
      const interest30 = ethers.parseEther("9.0"); // 30% interest
      const totalRepayment30 = loanAmount30 + interest30;
      await time.increase(90 * 24 * 60 * 60); // Move time forward 1 month

      await expect(
        Marygoround.connect(addr2).repayLoan({ value: totalRepayment30 })
      )
        .to.emit(Marygoround, "LoanRepaid")
        .withArgs(addr2.address, totalRepayment30);

      const memberData30 = await Marygoround.members(addr2.address);
      expect(memberData30.loanAmount).to.equal(0);

      // Request loana and pay 50%

      const loanAmount50 = ethers.parseEther("30.0");
      await expect(Marygoround.connect(addr2).requestLoan(loanAmount50))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr2.address, loanAmount50);

      const MemberData50 = await Marygoround.members(addr2.address);
      expect(MemberData50.loanAmount).to.equal(loanAmount50);

      // Loan repayment
      const interest50 = ethers.parseEther("15.0"); // 40% interest
      const totalRepayment50 = loanAmount50 + interest50;
      await time.increase(150 * 24 * 60 * 60); // Move time forward 1 month

      await expect(
        Marygoround.connect(addr2).repayLoan({ value: totalRepayment50 })
      )
        .to.emit(Marygoround, "LoanRepaid")
        .withArgs(addr2.address, totalRepayment50);

      const memberData50 = await Marygoround.members(addr2.address);
      expect(memberData50.loanAmount).to.equal(0);

      // // Trying to repay  non-active loan
      const Noactiveloan = ethers.parseEther("200.0");

      await expect(
        Marygoround.connect(addr4).repayLoan({ value: totalRepayment50 })
      ).to.be.revertedWith("No active loan");

      // Request loan and pay 100% interest
      const loanAmount100 = ethers.parseEther("30.0");
      await expect(Marygoround.connect(addr2).requestLoan(loanAmount100))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr2.address, loanAmount100);

      // Verify loan was recorded
      const MemberData100 = await Marygoround.members(addr2.address);
      expect(MemberData100.loanAmount).to.equal(loanAmount100);
      // Payout function
      await expect(
        Marygoround.connect(addr1).distributeFunds()
      ).to.be.revertedWith("Year not completed");

      await ethers.provider.send("evm_increaseTime", [370 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      // Revert is non member tries to distribute
      await expect(
        Marygoround.connect(addr10).distributeFunds()
      ).to.be.revertedWith("Only member can perform this action");

      await expect(Marygoround.connect(addr1).distributeFunds()).not.to.be
        .reverted;

      // Increase time to 1+ year (370 days)
      await time.increase(370 * 24 * 60 * 60);

      // Calculate repayment (100% interest)
      const interest100 = ethers.parseEther("30.0");
      const totalRepayment100 = loanAmount100 + interest100;

      // Expect repayment event
      await expect(
        Marygoround.connect(addr2).repayLoan({ value: totalRepayment100 })
      )
        .to.emit(Marygoround, "LoanRepaid")
        .withArgs(addr2.address, totalRepayment100)
        .to.emit(Marygoround, "MemberRemoved") // ✅ Ensure member removal event is emitted
        .withArgs(addr2.address);

      // Verify loan is cleared
      const memberData100 = await Marygoround.members(addr2.address);
      expect(memberData100.loanAmount).to.equal(0);

      // ✅ Check member is removed (should return default values)
      //expect(memberData100.savings).to.equal(0);
      expect(memberData100.loanAmount).to.equal(0);
      expect(memberData100.lastLoanTimestamp).to.equal(0);

      const loanAmountIn = ethers.parseEther("2.0");
      await expect(Marygoround.connect(addr4).requestLoan(loanAmountIn))
        .to.emit(Marygoround, "GivenLoan")
        .withArgs(addr4.address, loanAmountIn);
      const insufficientAmount = ethers.parseEther("0.1"); // 100% interest
      const totalRepaymentIn = loanAmountIn + insufficientAmount;

      await time.increase(90 * 24 * 60 * 60); // Move time forward 3 months

      await expect(
        Marygoround.connect(addr4).repayLoan({ value: totalRepaymentIn })
      ).to.be.revertedWith("Insufficient repayment amount");
    });
    // view member information
    it("should accurately retrieve the member's savings, loan amount, and last loan timestamp", async function () {
      // Retrieve data from the contract

      await Marygoround.connect(addr4).save({
        value: ethers.parseUnits("5", "ether"),
      });
      await Marygoround.connect(addr5).save({
        value: ethers.parseUnits("20", "ether"),
      });

      const [retrievedSavings, retrievedLoan, retrievedLastLoanTime] =
        await Marygoround.connect(addr4).MySavingsAndLoan();
      await Marygoround.connect(addr4).requestLoan(
        ethers.parseUnits("10", "ether")
      );

      // Define expected values
      const expectedSavings = ethers.parseUnits("5", "ether"); // Adjust as per test setup
      const expectedLoan = ethers.parseUnits("10", "ether"); // Adjust as per test setup

      // Fetch the current block timestamp
      const currentBlock = await ethers.provider.getBlock("latest");
      const currentTimestamp = currentBlock.timestamp;

      // Validate the retrieved data
      expect(retrievedSavings).to.equal(expectedSavings);
      //expect(retrievedLoan).to.equal(expectedLoan);
      expect(retrievedLastLoanTime).to.be.at.most(currentTimestamp);
    });
  });
});

//     it("should fail to distribute funds when contract balance is 0", async function () {
//       // Ensure no deposits have been made
//       const contractBalance = await ethers.provider.getBalance(
//         marygoround.address
//       );
//       expect(contractBalance).to.equal(0);

//       // Attempt to distribute funds, expecting it to revert
//       await expect(
//         marygoround.connect(member).distributeFunds()
//       ).to.be.revertedWith("No savings to distribute");
//     });
//     it("should distribute savings share correctly, deducting loss equally among members", async function () {
//       // Get balances before payout
//       const initialBalance1 = await ethers.provider.getBalance(
//         member1.address
//       );
//       const initialBalance2 = await ethers.provider.getBalance(
//         member2.address
//       );

//

//       // Check new balances
//       const finalBalance1 = await ethers.provider.getBalance(
//         member1.address
//       );
//       const finalBalance2 = await ethers.provider.getBalance(
//         member2.address
//       );

//       // Validate that members received correct payouts
//       expect(finalBalance1).to.equal(
//         initialBalance1.add(ethers.parseEther("3.5"))
//       );
//       expect(finalBalance2).to.equal(
//         initialBalance2.add(ethers.parseEther("7"))
//       );
//     });
//

//     describe("Viewing records", function () {
//       it("should show all savigs and laons", async function () {
//         it("should show all savigs and laons", async function () {
//           await expect(
//             Marygoround.connect(member).viewAllSavingsAndLoans()
//           )
//             .to.emit(Marygoround, "LoanRepaid")
//             .withArgs(
//               totalSavings,
//               totalLoaned,
//               totalSavings - totalLoaned
//             );
//         });
//       });
//     });
//   });
