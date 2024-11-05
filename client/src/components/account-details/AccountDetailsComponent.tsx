import { FC } from "react";
import { AccountDetails } from "../../types/AccountDetails";

interface Props {
  accountDetails: AccountDetails;
}

const AccountDetailsComponent: FC<Props> = ({ accountDetails }: Props) => {
  return (
    <>
      <div className="dataCell">
        <h3>Address: </h3>
        <span>{accountDetails.address}</span>
      </div>
      <div className="dataCell">
        <h3>Chain ID: </h3>
        <span>{accountDetails.chainId}</span>
      </div>
      <div className="dataCell">
        <h3>Balance (ETH): </h3>
        <span>{accountDetails.balance} ETH</span>
      </div>
    </>
  );
};

export default AccountDetailsComponent;
