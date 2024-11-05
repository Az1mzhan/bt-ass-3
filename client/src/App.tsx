import axios from "axios";
import {
  useState,
  useEffect,
  useCallback,
  FC,
  SyntheticEvent,
  JSX,
} from "react";
import { Contract, utils, Web3 } from "web3";
import { Nullable } from "./types/Nullable";
import { GeoInfo } from "./types/GeoInfo";
import { UserStats } from "./types/UserStats";
import { AccountDetails } from "./types/AccountDetails";
import "./App.css";
import { HealthAnalytics } from "./components/health-analytics/HealthAnalytics";
import { Tab, Tabs } from "@mui/material";
import { CustomTab } from "./components/custom-tab/CustomTab";
import AccountDetailsComponent from "./components/account-details/AccountDetailsComponent";
import { GeoInfoComponent } from "./components/geo-info/GeoInfoComponent";
import { ActivityDetails } from "./components/activity-details/ActivityDetails";

const App: FC = () => {
  const [web3, setWeb3] = useState<Nullable<Web3>>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    address: "",
    chainId: 0,
    balance: 0,
  });

  const [tokenContract, setTokenContract] =
    useState<Nullable<Contract<object>>>(null);
  const [platformContract, setPlatformContract] =
    useState<Nullable<Contract<object>>>(null);

  const [geoInfo, setGeoInfo] = useState<GeoInfo>({
    coords: {
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
  const [coolDownTimer, setCoolDownTimer] = useState<number>(0);
  const [selectedValue, setSelectedValue] = useState<number>(0);

  const getAccountInfo = async (
    account: string = accountDetails.address
  ): Promise<void> => {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });
    const etherBalance = parseFloat(utils.fromWei(balance, "ether"));

    setAccountDetails({
      address: account,
      chainId: parseInt(chainId, 16),
      balance: etherBalance,
    });
  };

  const loadBlockChainData = useCallback(async (): Promise<void> => {
    try {
      if (!window.ethereum) return;

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await getAccountInfo(accounts[0]);

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

      const _tokenContract: Contract<object> = new web3Instance.eth.Contract(
        tokenABI,
        tokenNetworkData.address
      );
      setTokenContract(_tokenContract);

      const _platformContract: Contract<object> = new web3Instance.eth.Contract(
        platformABI,
        platformNetworkData.address
      );
      setPlatformContract(_platformContract);
    } catch (error) {
      throw new Error(error);
    }
  }, []);

  useEffect(() => {
    loadBlockChainData();
  }, [loadBlockChainData]);

  const authorizeUser = useCallback(
    async (account: string = accountDetails.address): Promise<void> => {
      const isRegistered = await platformContract?.methods
        .checkRegister()
        .call({ from: account });

      if (!isRegistered)
        await platformContract?.methods.registerUser().send({ from: account });
    },
    [platformContract]
  );

  const handleAccountDetails = async (accounts: string[]): Promise<void> => {
    await getAccountInfo(accounts[0]);
    await authorizeUser(accounts[0]);
  };

  useEffect(() => {
    console.log("dad: ", platformContract);

    if (!platformContract) return;

    authorizeUser();

    window.ethereum.on("accountsChanged", handleAccountDetails);

    const eventSource = new EventSource(
      "http://localhost:5000/stream-geo-info"
    );

    eventSource.onmessage = async (event: MessageEvent): Promise<void> => {
      const newGeoInfo: GeoInfo = JSON.parse(event.data);
      setGeoInfo(newGeoInfo);
      console.log(newGeoInfo);

      const isRegistered = await platformContract?.methods
        .checkRegister()
        .call({ from: accountDetails.address });

      if (isRegistered) {
        const newUserStats = await platformContract?.methods
          .getUserStats()
          .call({ from: accountDetails.address });

        setUserStats({
          lastActivityTimestamp: new Date(Number(newUserStats["0"]) * 1000),
          totalDistance: Number(newUserStats["1"]) / 10 ** 18,
          totalRewards: Number(newUserStats["2"]),
        });
      }
    };

    return () => {
      eventSource.close();
      window.ethereum.removeListener("accountsChanged", handleAccountDetails);
    };
  }, [platformContract]);

  const loadUserStats = async (): Promise<void> => {
    console.log(platformContract);

    await platformContract?.methods
      .logActivity(BigInt(geoInfo.distance * 10 ** 18))
      .send({ from: accountDetails.address });

    const newUserStats = await platformContract?.methods
      .getUserStats()
      .call({ from: accountDetails.address });

    setUserStats({
      lastActivityTimestamp: new Date(Number(newUserStats["0"]) * 1000),
      totalDistance: Number(newUserStats["1"]) / 10 ** 18,
      totalRewards: Number(newUserStats["2"]),
    });
  };

  const getUserStats = async () => {
    await loadUserStats();
  };

  const getBalance = async (): Promise<number> => {
    await tokenContract?.methods
      .balanceOf()
      .call({ from: accountDetails.address });
  };

  const collectRewards = async (): Promise<void> => {
    await tokenContract?.methods
      .transfer(platformContract?.options.address, userStats.totalRewards)
      .send({ from: accountDetails.address });

    await platformContract?.methods
      .collectRewards()
      .send({ from: accountDetails.address });
  };

  const handleSelectedValue = (e: SyntheticEvent, newValue: number) => {
    setSelectedValue(newValue);
  };

  const tabLabels: string[] = [
    "Account details",
    "Geo info",
    "Activity details",
    "Health metrics",
  ];
  const tabComponents: JSX.Element[] = [
    <AccountDetailsComponent accountDetails={accountDetails} />,
    <GeoInfoComponent geoInfo={geoInfo} />,
    <ActivityDetails
      userStats={userStats}
      getUserStats={getUserStats}
      collectRewards={collectRewards}
    />,
    <HealthAnalytics
      platformContract={platformContract}
      account={accountDetails.address}
    />,
  ];

  return (
    <div className="app">
      <Tabs
        value={selectedValue}
        onChange={handleSelectedValue}
        indicatorColor="white"
      >
        {tabLabels.map((label) => (
          <Tab label={label} />
        ))}
      </Tabs>
      {tabComponents.map((component, id) => (
        <CustomTab
          key={id}
          isHidden={selectedValue !== id}
          element={component}
        />
      ))}
    </div>
  );
};

export default App;
