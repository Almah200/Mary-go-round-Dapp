// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Marygoround {
    address public owner;
    uint256 public contractStartTime;
    uint256 public totalSavings;
    uint256 public totalLoaned;

    struct Member {
        bool isMember;
        uint256 totalSavings;
        uint256 loanAmount;
        uint256 lastLoanTimestamp;
    }
    mapping(address => Member) public members;
    address[] public memberList; // List to store member addresses

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyMember() {
        require(
            members[msg.sender].isMember,
            "Only member can perform this action"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        contractStartTime = block.timestamp;
    }

    event MemberAdded(address _member);

    function addMember(address _member) external onlyOwner {
        require(!members[_member].isMember, "Member already exist");
        members[_member].isMember = true;
        memberList.push(_member); // Store new member in the list
        emit MemberAdded(_member);
    }

    event SaveAdded(address indexed _from, uint _amount);

    function save() external payable onlyMember {
        require(msg.value > 0, "Must deposit some ETH");
        members[msg.sender].totalSavings += msg.value;
        totalSavings += msg.value;
        emit SaveAdded(msg.sender, msg.value);
    }

    event GivenLoan(address _to, uint _amount);

    function requestLoan(uint256 _amount) external onlyMember {
        require(
            members[msg.sender].loanAmount == 0,
            "Existing loan must be repaid first"
        );
        require(members[msg.sender].totalSavings > 0, "No savings available");
        require(
            _amount <= members[msg.sender].totalSavings * 2,
            "Loan exceeds allowed limit"
        );

        require(
            _amount <= totalSavings,
            "No sufficient amount in the account currently"
        );

        members[msg.sender].loanAmount = _amount;
        members[msg.sender].lastLoanTimestamp = block.timestamp;
        totalLoaned += _amount;

        payable(msg.sender).transfer(_amount);
        emit GivenLoan(msg.sender, _amount);
    }

    event LoanRepaid(address indexed member, uint256 amountPaid);
    event MemberRemoved(address indexed member);

    function repayLoan() external payable onlyMember {
        Member storage member = members[msg.sender];
        require(member.loanAmount > 0, "No active loan");

        uint256 monthsElapsed = (block.timestamp - member.lastLoanTimestamp) /
            30 days;
        uint256 interestRate;

        if (monthsElapsed < 12) {
            // Gradual interest increase
            if (monthsElapsed <= 1) {
                interestRate = 10;
            } else if (monthsElapsed > 1 && monthsElapsed <= 2) {
                interestRate = 20;
            } else if (monthsElapsed > 2 && monthsElapsed <= 3) {
                interestRate = 30;
            } else {
                interestRate = 50;
            }
        } else {
            // 100% interest for late repayment (after 12 months)
            interestRate = 100;
        }

        // ✅ Prevent overflow by using checked arithmetic
        require(
            100 + interestRate <= type(uint256).max / member.loanAmount,
            "Overflow risk"
        );

        uint256 totalDue = (member.loanAmount * (100 + interestRate)) / 100;
        require(msg.value >= totalDue, "Insufficient repayment amount");

        totalLoaned -= member.loanAmount; // ✅ Deduct before setting to zero
        member.loanAmount = 0;
        member.lastLoanTimestamp = 0;

        emit LoanRepaid(msg.sender, totalDue);

        // ✅ If repayment is **after** 1 year, remove member
        if (monthsElapsed >= 12) {
            delete members[msg.sender];
            emit MemberRemoved(msg.sender);
        }
    }

    event Payoutmade(address indexed _to, uint256 amount);

    function distributeFunds() external onlyMember {
        require(
            block.timestamp >= contractStartTime + 365 days,
            "Year not completed"
        );
        require(totalSavings > 0, "No savings to distribute");

        uint256 totalFunds = address(this).balance; // Total funds available
        uint256 totalInterestProfit = 0;
        uint256 totalLoss = 0;

        if (totalFunds > totalSavings) {
            totalInterestProfit = totalFunds - totalSavings;
        }

        if (totalSavings > totalFunds) {
            totalLoss = totalSavings - totalFunds;
        }

        for (uint256 i = 0; i < memberList.length; i++) {
            address acc = memberList[i]; // Get member address
            if (members[acc].isMember) {
                // Calculate savings share
                uint256 savingsShare = (members[acc].totalSavings *
                    totalFunds) / totalSavings;

                // Deduct equal loss share if there is a shortfall
                if (totalLoss > 0 && memberList.length > 0) {
                    uint256 lossShare = totalLoss / memberList.length; // Each member gets an equal share of the loss
                    savingsShare -= lossShare; // Deduct the equal loss from each member's payout
                }

                payable(acc).transfer(savingsShare);
                emit Payoutmade(acc, savingsShare);
            }
        }

        contractStartTime = block.timestamp; // Reset the yearly timer
    }

    // Owner can view all members' savings, loans, and remaining balance
    function AllSavingsAndLoans()
        external
        view
        onlyMember
        returns (
            uint256 totalSaved,
            uint256 totalLoanedOut,
            uint256 availableFunds
        )
    {
        return (totalSavings, totalLoaned, totalSavings - totalLoaned);
    }

    function MySavingsAndLoan()
        external
        view
        onlyMember
        returns (uint256 savings, uint256 loan, uint256 lastLoanTime)
    {
        Member storage member = members[msg.sender];
        return (
            member.totalSavings,
            member.loanAmount,
            member.lastLoanTimestamp
        );
    }
}
