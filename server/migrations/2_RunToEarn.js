const RunToken = artifacts.require("RunToken");
const RunToEarn = artifacts.require("RunToEarn");

module.exports = (deployer) => {
  deployer.deploy(RunToken, 10000000000000000000n).then(() => {
    return deployer.deploy(RunToEarn, RunToken.address);
  });
};
