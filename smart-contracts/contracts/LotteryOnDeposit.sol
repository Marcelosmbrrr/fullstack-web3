// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

// Taxa de depósito ao invés de parte pro ganhador

contract LotteryOnDeposit {
    uint public constant ENTRY_VALUE = 1 ether;
    uint public constant WIN_CHANCE_DIVISOR = 100_000; // 1 em 100.000 (0.001%)
    uint public constant OWNER_SHARE_PERCENT = 1; // 0.1% (1/1000)
    uint public constant WINNER_SHARE_PERCENT = 995; // 99.5% (995/1000)
    uint public constant INITIALIZER_SHARE_PERCENT = 5; // 0.5% (5/1000)
    uint public constant MIN_PRIZE_TO_WIN = 1 ether; // Prêmio mínimo para permitir vitórias
    uint public constant MIN_TIME_BETWEEN_DEPOSITS = 1 hours; // Tempo mínimo exigido entre depósitos

    enum Status { RUNNING, WAITING }
    Status public currentStatus;
    
    uint public totalParticipants;
    uint public totalPrize;
    address public owner;
    address public lastInitializer;
    uint public currentWinChanceDivisor = WIN_CHANCE_DIVISOR;

    mapping(address => uint) public lastDepositTime; // Limitador de requisições
    mapping(address => bool) public hasInitializedBefore; // Limitador de inicializadores

    event NewDeposit(address indexed participant, uint amount);
    event WinnerSelected(
        address indexed winner,
        uint prize,
        uint ownerShare,
        uint initializerShare,
        uint totalParticipants
    );
    event NewRoundStarted(address indexed initializer);

    constructor() {
        owner = msg.sender;
        currentStatus = Status.WAITING; // Starts in waiting status
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRunning() {
        require(currentStatus == Status.RUNNING, "Lottery not running");
        _;
    }

    modifier onlyWaiting() {
        require(currentStatus == Status.WAITING, "Lottery not waiting");
        _;
    }

    modifier neverInitializerBefore() {
        require(!hasInitializedBefore[msg.sender], "Already initialized once");
        _;
    }

    // ============================================================== GET/VIEW FUNCTIONS 

    function getCurrentWinChance() public view returns (uint) {
        return currentWinChanceDivisor;
    }

    // Refatorar: Chainlink VRF
    function getRandomNumber() internal view returns (uint) {
        return uint(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            totalParticipants
        ))) % currentWinChanceDivisor;
    }

    // ============================================================== SET FUNCTIONS

    function startNewRound() external payable onlyWaiting neverInitializerBefore {
        require(msg.value == ENTRY_VALUE, "Exactly 1 ETH required");
        
        lastInitializer = msg.sender;
        hasInitializedBefore[msg.sender] = true;
        currentStatus = Status.RUNNING;
        totalParticipants = 1; 
        totalPrize = msg.value;
        currentWinChanceDivisor = WIN_CHANCE_DIVISOR;
        
        emit NewRoundStarted(msg.sender);
        emit NewDeposit(msg.sender, msg.value);
    }

    function deposit() external payable onlyRunning {
        require(msg.value == ENTRY_VALUE, "Exactly 1 ETH required");
        require(block.timestamp >= lastDepositTime[msg.sender] + MIN_TIME_BETWEEN_DEPOSITS, "Deposit too soon, wait 1 hour");

        lastDepositTime[msg.sender] = block.timestamp;
        totalPrize += msg.value;
        totalParticipants++;
        
        emit NewDeposit(msg.sender, msg.value);

        if (totalPrize >= MIN_PRIZE_TO_WIN) {
            uint random = getRandomNumber();
            if (random < currentWinChanceDivisor) {
                distributePrize();
            }
        }
    }

    function distributePrize() internal {
        uint ownerShare = (totalPrize * OWNER_SHARE_PERCENT) / 1000;
        uint initializerShare = (totalPrize * INITIALIZER_SHARE_PERCENT) / 1000;
        uint winnerPrize = (totalPrize * WINNER_SHARE_PERCENT) / 1000;

        totalPrize = 0; 
        currentStatus = Status.WAITING;

        payable(msg.sender).transfer(winnerPrize);
        payable(owner).transfer(ownerShare);
        payable(lastInitializer).transfer(initializerShare);

        emit WinnerSelected(
            msg.sender,
            winnerPrize,
            ownerShare,
            initializerShare,
            totalParticipants
        );
    }

    function setWinChanceDivisor(uint newDivisor) external onlyOwner {
        require(newDivisor > 0 && newDivisor <= WIN_CHANCE_DIVISOR, "Invalid divisor");
        currentWinChanceDivisor = newDivisor;
    }

}