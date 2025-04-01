// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Marygoroundhourtest {
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
    address[] public memberList;

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
        require(!members[_member].isMember, "Member already exists");
        members[_member].isMember = true;
        memberList.push(_member);
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
        require(_amount <= totalSavings, "No sufficient funds available");

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

        uint256 minutesElapsed = (block.timestamp - member.lastLoanTimestamp) /
            60; // Convert to minutes
        uint256 interestRate;

        if (minutesElapsed < 60) {
            // Within 1 hour
            if (minutesElapsed <= 10) {
                interestRate = 10;
            } else if (minutesElapsed > 10 && minutesElapsed <= 20) {
                interestRate = 20;
            } else if (minutesElapsed > 20 && minutesElapsed <= 30) {
                interestRate = 30;
            } else if (minutesElapsed > 30 && minutesElapsed <= 40) {
                interestRate = 40;
            } else {
                interestRate = 50;
            }
        } else {
            interestRate = 100; // Default to 100% interest after 1 hour
        }

        uint256 totalDue = (member.loanAmount * (100 + interestRate)) / 100;
        require(msg.value >= totalDue, "Insufficient repayment amount");

        totalLoaned -= member.loanAmount;
        member.loanAmount = 0;
        member.lastLoanTimestamp = 0;

        emit LoanRepaid(msg.sender, totalDue);

        if (minutesElapsed >= 60) {
            delete members[msg.sender];
            emit MemberRemoved(msg.sender);
        }
    }

    event PayoutMade(address indexed _to, uint256 amount);

    function distributeFunds() external onlyMember {
        require(
            block.timestamp >= contractStartTime + 1 hours,
            "1 hour not completed"
        );
        require(totalSavings > 0, "No savings to distribute");

        uint256 totalFunds = address(this).balance;
        uint256 totalInterestProfit = 0;
        uint256 totalLoss = 0;

        if (totalFunds > totalSavings) {
            totalInterestProfit = totalFunds - totalSavings;
        }

        if (totalSavings > totalFunds) {
            totalLoss = totalSavings - totalFunds;
        }

        for (uint256 i = 0; i < memberList.length; i++) {
            address acc = memberList[i];
            if (members[acc].isMember) {
                uint256 savingsShare = (members[acc].totalSavings *
                    totalFunds) / totalSavings;
                if (totalLoss > 0 && memberList.length > 0) {
                    uint256 lossShare = totalLoss / memberList.length;
                    savingsShare -= lossShare;
                }
                payable(acc).transfer(savingsShare);
                emit PayoutMade(acc, savingsShare);
            }
        }
        contractStartTime = block.timestamp;
    }

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
