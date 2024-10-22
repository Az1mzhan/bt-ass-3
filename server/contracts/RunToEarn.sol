// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// The main token for the platform
contract RunToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("RunToken", "RUN") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// The main contract for the run-to-earn platform
contract RunToEarn is Ownable, ReentrancyGuard {
    RunToken public runToken;

    struct User {
        bool isRegistered;
        uint256 lastActivityTimestamp;
        uint256 recentReward;  // Represented as fixed-point value
        uint256 totalDistance; // Represented as fixed-point value (multiplied by 1e18 for precision)
        uint256 totalRewards;  // Represented as fixed-point value (multiplied by 1e18 for precision)
    }

    mapping(address => User) public users;

    uint256 public constant REWARD_PER_KM = 10**8; // 0.01 tokens per km, scaled by 1e18 for precision
    uint256 public constant MIN_TIME_BETWEEN_ACTIVITIES = 1 hours;

    event UserRegistered(address indexed user);
    event ActivityLogged(address indexed user, uint256 distance, uint256 rewards);

    constructor(address _runTokenAddress) Ownable(msg.sender) {
        runToken = RunToken(_runTokenAddress);
    }

    function registerUser() public {
        require(!users[msg.sender].isRegistered, "User already registered");
        users[msg.sender] = User(true, 0, 0, 0, 0);
        emit UserRegistered(msg.sender);
    }

    // Accept distance in fixed-point format (e.g., 1.234 km as 1234000000000000000)
    function logActivity(uint256 distance) public nonReentrant {
        require(users[msg.sender].isRegistered, "User not registered");
        require(block.timestamp - users[msg.sender].lastActivityTimestamp >= MIN_TIME_BETWEEN_ACTIVITIES, "Too soon since last activity");

        uint256 reward = calculateReward(distance);

        users[msg.sender].totalDistance += distance; // Add precise distance in fixed-point form
        users[msg.sender].recentReward = reward;
        users[msg.sender].totalRewards += reward;
        users[msg.sender].lastActivityTimestamp = block.timestamp;

        emit ActivityLogged(msg.sender, distance, reward);
    }

    function collectRewards() public {
        uint256 reward = users[msg.sender].totalRewards;

        require(reward > 0, "No rewards to collect");

        require(runToken.transfer(msg.sender, reward), "Contract transfer failed");

        // Reset the user's rewards after collection
        users[msg.sender].totalRewards = 0;
    }

    // Adjust reward calculation to accept distance as a fixed-point value
    function calculateReward(uint256 distance) public pure returns (uint256) {
        // Use fixed-point arithmetic to calculate rewards based on distance
        return distance * REWARD_PER_KM / 10 ** 18;
    }

    function getUserStats(address userAddress) public view returns (uint256, uint256, uint256, uint256) {
        return (
            users[userAddress].lastActivityTimestamp,
            users[userAddress].recentReward, // Fixed-point value
            users[userAddress].totalDistance, // Fixed-point value
            users[userAddress].totalRewards  // Fixed-point value
        );
    }

    function getBalance() public view returns (uint256) {
        return runToken.balanceOf(address(this));
    }

    function checkRegister(address userAddress) public view returns (bool) {
        return users[userAddress].isRegistered;
    }
}

// A simple marketplace contract for the platform
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