// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RunToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("RunToken", "RUN") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

contract RunToEarn is Ownable, ReentrancyGuard {
    RunToken public runToken;

    struct User {
        bool isRegistered;
        uint256 lastActivityTimestamp;
        uint256 totalDistance;
        uint256 totalRewards;
    }

    mapping(address => User) public users;

    uint256 public constant REWARD_PER_KM = 10**8;
    uint256 public constant MIN_TIME_BETWEEN_ACTIVITIES = 10 seconds;

    event UserRegistered(address indexed user);
    event ActivityLogged(address indexed user, uint256 distance, uint256 rewards);

    constructor(address _runTokenAddress) Ownable(msg.sender) {
        runToken = RunToken(_runTokenAddress);
    }

    function registerUser() public {
        require(!users[msg.sender].isRegistered, "User already registered");
        users[msg.sender] = User(true, block.timestamp, 0, 0);
        emit UserRegistered(msg.sender);
    }

    function logActivity(uint256 distance) public nonReentrant {
        require(users[msg.sender].isRegistered, "User not registered");
        require(block.timestamp - users[msg.sender].lastActivityTimestamp >= MIN_TIME_BETWEEN_ACTIVITIES, "Too soon since last activity");

        uint256 reward = calculateReward(distance);

        users[msg.sender].totalDistance += distance;
        users[msg.sender].totalRewards += reward;
        users[msg.sender].lastActivityTimestamp = block.timestamp;

        emit ActivityLogged(msg.sender, distance, reward);
    }

    function collectRewards() public {
        uint256 reward = users[msg.sender].totalRewards;

        require(reward > 0, "No rewards to collect");

        require(runToken.transfer(msg.sender, reward), "Contract transfer failed");

        users[msg.sender].totalRewards = 0;
    }

    function checkRegister() public view returns (bool) {
        return users[msg.sender].isRegistered;
    }

    // Adjust reward calculation to accept distance as a fixed-point value
    function calculateReward(uint256 distance) public pure returns (uint256) {
        return distance * REWARD_PER_KM / 10 ** 18;
    }

    function convertTotalDistanceToSteps() public view returns (uint256) {
        uint256 avgStrideLength = 78 * 10 ** 15;

        return (users[msg.sender].totalDistance * 10 ** 3) / avgStrideLength;
    }

    function calculateBurnedCalories(uint256 weight) public view returns (uint256) {
        return users[msg.sender].totalDistance * weight / 2;
    }

    function getUserStats() public view returns (uint256, uint256, uint256) {
        return (
            users[msg.sender].lastActivityTimestamp,
            users[msg.sender].totalDistance,
            users[msg.sender].totalRewards
        );
    }

    function getHealthStats(uint256 weight) public view returns (uint256, uint256, uint256) {
        return (
            users[msg.sender].totalDistance,
            convertTotalDistanceToSteps(),
            calculateBurnedCalories(weight)
        );
    }

    function getBalance() public view returns (uint256) {
        return runToken.balanceOf(msg.sender);
    }
}

contract RunMarketplace is Ownable, ReentrancyGuard {
    RunToken public runToken;

    struct Item {
        uint256 id;
        string name;
        uint256 price;
        address seller;
        bool isAvailable;
    }

    mapping(uint256 => Item) public items;
    uint256 public itemCount;

    event ItemListed(uint256 indexed id, string name, uint256 price, address seller);
    event ItemPurchased(uint256 indexed id, address buyer, address seller, uint256 price);

    constructor(address _runTokenAddress) Ownable(msg.sender) {
        runToken = RunToken(_runTokenAddress);
    }

    function listItem(string memory name, uint256 price) public {
        itemCount++;
        items[itemCount] = Item(itemCount, name, price, msg.sender, true);
        emit ItemListed(itemCount, name, price, msg.sender);
    }

    function purchaseItem(uint256 itemId) public nonReentrant {
        Item storage item = items[itemId];
        require(item.isAvailable, "Item is not available");
        require(runToken.balanceOf(msg.sender) >= item.price, "Insufficient balance");

        item.isAvailable = false;
        require(runToken.transferFrom(msg.sender, item.seller, item.price), "Transfer failed");

        emit ItemPurchased(itemId, msg.sender, item.seller, item.price);
    }
}