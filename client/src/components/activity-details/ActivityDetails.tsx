import { FC } from "react";
import { UserStats } from "../../types/UserStats";
import styles from "./activityDetails.module.css";

interface Props {
  userStats: UserStats;
  loadUserStats: () => Promise<void>;
  collectRewards: () => Promise<void>;
}

export const ActivityDetails: FC<Props> = ({
  userStats,
  loadUserStats,
  collectRewards,
}: Props) => {
  return (
    <div className="dataContainer">
      <div className="dataCell">
        <h3>Recent activity's timestamp: </h3>
        <span>{userStats.lastActivityTimestamp.toLocaleString()}</span>
      </div>
      <div className="dataCell">
        <h3>Total distance:</h3>
        <span>{userStats.totalDistance}</span>
      </div>
      <div className="dataCell">
        <h3>Reward:</h3>
        <span>{Number(userStats.totalRewards) / 10 ** 8} RUN</span>
      </div>
      <div className={styles.activityButtonsContainer}>
        <button className={styles.activityButton} onClick={loadUserStats}>
          Update activity details
        </button>
        <button className={styles.activityButton} onClick={collectRewards}>
          Redeem rewards
        </button>
      </div>
      <p className="note">
        Note: Press "Update activity details" to update details
      </p>
    </div>
  );
};
