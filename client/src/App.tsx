import axios from "axios";
import { useState, useEffect, useCallback, FC } from "react";
import { Contract, Web3 } from "web3";
import { Nullable } from "./types/Nullable";
import { GeoInfo } from "./types/GeoInfo";
import { UserStats } from "./types/UserStats";

const App: FC = () => {
  const [web3, setWeb3] = useState<Nullable<Web3>>(null);
  const [account, setAccount] = useState<string>("");

  const [tokenContract, setTokenContract] =
    useState<Nullable<Contract<object>>>(null);
  const [platformContract, setPlatformContract] =
    useState<Nullable<Contract<object>>>(null);

  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    currCoords: {
      latitude: 0,
      longitude: 0,
    },
    distance: 0,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    lastActivityTimestamp: new Date(),
    recentReward: 0,
    totalDistance: 0,
    totalRewards: 0,
  });
  const [totalDistance, setTotalDistance] = useState<bigint>(0n);

  const loadBlockChainData = useCallback(async () => {
    try {
      // @ts-expect-error
      if (!window.ethereum) return;

      // @ts-expect-error
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // @ts-expect-error
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      const networkId = await web3Instance.eth.net.getId();

      const tokenContractRequest = await axios.post(
        "http://localhost:5000/contract",
        {
          contractName: "RunToken",
        }
      );
      const tokenContractJSON = tokenContractRequest.data;

      const platformContractRequest = await axios.post(
        "http://localhost:5000/contract",
        {
          contractName: "RunToEarn",
        }
      );
      const platformContractJSON = platformContractRequest.data;

      // @ts-expect-error
      const tokenNetworkData = tokenContractJSON.networks[networkId];
      // @ts-expect-error
      const platformNetworkData = platformContractJSON.networks[networkId];

      if (!tokenNetworkData || !platformNetworkData) return;

      // @ts-expect-error
      const tokenABI = tokenContractJSON.abi;
      // @ts-expect-error
      const platformABI = platformContractJSON.abi;

      // @ts-expect-error
      const _tokenContract = new web3Instance.eth.Contract(
        tokenABI,
        tokenNetworkData.address
      );
      setTokenContract(_tokenContract);

      // @ts-expect-error
      const _platformContract = new web3Instance.eth.Contract(
        platformABI,
        platformNetworkData.address
      );
      setPlatformContract(_platformContract);
    } catch (error) {
      throw new Error(error);
    }
  }, []);

  useEffect(() => {
    console.log("Dads");
  }, [account]);

  const logContractActivity = useCallback(async () => {
    const isRegistered = await checkRegister();

    if (!isRegistered) await registerUser();

    if (totalDistance >= 10) {
      await logActivity(BigInt(totalDistance * 10 ** 18));
      await getUserStats();
    }
  }, [platformContract, tokenContract, account]);

  useEffect(() => {
    loadBlockChainData()
      .then(() => {
        console.log(platformContract);
      })
      .then(() => {
        const eventSource = new EventSource(
          "http://localhost:5000/stream-geo-info"
        );

        eventSource.onmessage = async (event: MessageEvent) => {
          const newGeoInfo: GeoInfo = JSON.parse(event.data);
          setGeoInfo(newGeoInfo);
          setTotalDistance(
            (prev) => prev + BigInt(newGeoInfo.distance * 10 ** 18)
          );
        };

        return () => {
          eventSource.close();
        };
      });
  }, [loadBlockChainData]);

  useEffect(() => {
    logContractActivity();
  }, [logContractActivity]);

  const registerUser = async (): Promise<void> => {
    if (!platformContract) return;

    await platformContract.methods.registerUser().send({ from: account });
  };

  const logActivity = async (distance: bigint): Promise<void> => {
    if (!platformContract) return;

    await platformContract.methods
      .logActivity(distance)
      .send({ from: account });
  };

  const getUserStats = async (): Promise<void> => {
    if (!platformContract) return;

    await logActivity(BigInt(geoInfo.distance * 10 ** 18));

    const newUserStats = await platformContract.methods
      .getUserStats(account)
      .call();
    setUserStats({
      lastActivityTimestamp: new Date(Number(newUserStats["0"]) * 1000),
      recentReward: Number(newUserStats["1"]),
      totalDistance: Number(newUserStats["2"]) / 10 ** 18,
      totalRewards: Number(newUserStats["3"]),
    });
  };

  const collectRewards = async (): Promise<void> => {
    if (!platformContract) return;

    await logActivity(totalDistance * 10 ** 18);

    await transferTokensToPlatform();

    await platformContract.methods.collectRewards().call;
  };

  const checkRegister = async (): Promise<boolean> => {
    if (!platformContract) return;

    const isRegistered = await platformContract.methods
      .checkRegister(account)
      .call();

    return isRegistered;
  };

  const transferTokensToPlatform = async (): Promise<void> => {
    if (!tokenContract || !platformContract) return;

    await tokenContract.methods.transfer(
      platformContract.options.address,
      userStats.totalRewards
    );
  };

  const getRunTokenBalance = async () => {
    try {
      // @ts-expect-error
      const balance = await tokenContract.methods.balanceOf(account).call();
      console.log("RunToken Balance:", balance);
    } catch (error) {
      console.error("Error fetching RunToken balance:", error);
      throw new Error(error);
    }
  };

  return (
    <div>
      <h1>Rapid</h1>
      <p>Connected Account: {account}</p>
      <h2>User stats:</h2>
      <p>
        Last activity timestamp:{" "}
        {userStats.lastActivityTimestamp.toLocaleString()}
      </p>
      <p>Recent reward: {userStats.recentReward} RPT</p>
      <p>Total distance: {userStats.totalDistance} km</p>
      <p>Total rewards: {userStats.totalRewards} RPT</p>
      <button onClick={getRunTokenBalance}>Check RunToken Balance</button>
      <button onClick={getUserStats}>Update user stats</button>
      <button onClick={collectRewards}>Collect rewards</button>
    </div>
  );
};

export default App;
