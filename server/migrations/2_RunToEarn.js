const RunToken = artifacts.require("RunToken");
const RunToEarn = artifacts.require("RunToEarn");

module.exports = async function (deployer) {
  const runTokenInstance = await RunToken.deployed();
  const runTokenAddress = runTokenInstance.address;

  await deployer.deploy(RunToEarn, runTokenAddress);
};
