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
  const [userStats, setUserStats] = useState<Nullable<UserStats>>(null);

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
      const tokenABI = tokenContract.abi;
      // @ts-expect-error
      const platformABI = platformContract.abi;

      // @ts-expect-error
      const tokenContract = new web3.eth.Contract(
        tokenABI,
        tokenNetworkData.address
      );
      setTokenContract(tokenContract);

      // @ts-expect-error
      const platformContract = new web3.eth.Contract(
        platformABI,
        platformNetworkData.address
      );
      setPlatformContract(platformContract);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      throw new Error(error);
    }
  }, []);

  useEffect(() => {
    loadBlockChainData();
  }, [loadBlockChainData]);

  useEffect(() => {
    // Create an EventSource connection to receive coordinates from the server
    const eventSource = new EventSource("http://localhost:5000/stream-coords");

    eventSource.onmessage = (event: MessageEvent) => {
      const newGeoInfo: GeoInfo = JSON.parse(event.data);
      setGeoInfo(newGeoInfo);
    };

    return () => {
      eventSource.close();
    };
  }, []);

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

  const getUserStats = async () => {
    try {
      // @ts-expect-error
      const userStats = await platformContract.methods
        .getUserStats(account)
        .call();

      setUserStats(userStats);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      throw new Error(error);
    }
  };

  return (
    <div>
      <h1>RunToEarn Platform</h1>
      <p>Connected Account: {account}</p>
      <button onClick={getRunTokenBalance}>Check RunToken Balance</button>
      <button onClick={getUserStats}>Check Rewards</button>
    </div>
  );
};

export default App;
