import { FC, useCallback, useEffect, useState } from "react";
import { Contract } from "web3";
import { HealthStats } from "../../types/HealthStats";
import { Nullable } from "../../types/Nullable";
import { Gauge, LineChart } from "@mui/x-charts";
import styles from "./healthAnalytics.module.css";
import axios from "axios";
import { GeoInfo } from "../../types/GeoInfo";

interface Props {
  platformContract: Nullable<Contract<object>>;
  account: string;
}

export const HealthAnalytics: FC<Props> = ({
  platformContract,
  account,
}: Props) => {
  const [healthStats, setHealthStats] = useState<HealthStats>({
    totalDistance: 0,
    totalSteps: 0,
    burnedCalories: 0,
  });
  const [chartInfo, setChartInfo] = useState<GeoInfo[]>([]);

  const getHealthAnalyticsData = useCallback(() => {
    setInterval(() => {
      if (!platformContract) return;

      const healthRawData = platformContract.methods
        .getHealthStats(70)
        .call({ from: account });

      console.log(healthRawData);

      healthRawData.then(() => {
        setHealthStats({
          totalDistance: Number(healthRawData[0]),
          totalSteps: Number(healthRawData[1]),
          burnedCalories: Number(healthRawData[2]),
        });
      });

      const newChartInfo = axios.get("http://localhost:5000/chart-info");
      newChartInfo.then((res) => {
        setChartInfo(res.data);
      });
    }, 10000);
  }, [platformContract, account]);

  useEffect(() => {
    getHealthAnalyticsData();
  }, [getHealthAnalyticsData]);

  return (
    <div className={styles.healthAnalytics}>
      <div className={styles.chartBlock}>
        <Gauge
          width={300}
          height={200}
          value={Number(healthStats.burnedCalories) / 10 ** 18}
          startAngle={-90}
          endAngle={90}
        />
        <h3>Burned calories (kcal)</h3>
      </div>
      <div className={styles.chartBlock}>
        <Gauge
          width={300}
          height={200}
          value={healthStats.totalSteps}
          startAngle={-90}
          endAngle={90}
        />
        <h3>Total Steps</h3>
      </div>
      <div className={styles.chartBlock}>
        <LineChart
          series={[
            {
              data: chartInfo.map((item) => item.distance),
            },
          ]}
          width={500}
          height={300}
        />
        <h3>Distance dynamics</h3>
      </div>
    </div>
  );
};
