import { FC } from "react";
import { AccountDetails } from "../../types/AccountDetails";

interface Props {
  accountDetails: AccountDetails;
  tokenBalance: number;
}

const AccountDetailsComponent: FC<Props> = ({
  accountDetails,
  tokenBalance,
}: Props) => {
  return (
    <div className="dataContainer">
      <div className="dataCell">
        <h3>Address: </h3>
        <span>{accountDetails.address}</span>
      </div>
      <div className="dataCell">
        <h3>Chain ID: </h3>
        <span>{accountDetails.chainId}</span>
      </div>
      <div className="dataCell">
        <h3>Wallet balance: </h3>
        <span>{accountDetails.balance} ETH</span>
      </div>
      <div className="dataCell">
        <h3>Token balance: </h3>
        <span>{tokenBalance / 10 ** 18} RUN</span>
      </div>
    </div>
  );
};

export default AccountDetailsComponent;
