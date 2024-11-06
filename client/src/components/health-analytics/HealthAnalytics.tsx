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
  const [timeStamps, setTimestamps] = useState<string[]>([]);

  const getHealthAnalyticsData = useCallback(() => {
    setInterval(() => {
      if (!platformContract) return;

      const healthRawData = platformContract.methods
        .getHealthStats(70)
        .call({ from: account });

      healthRawData.then((res) => {
        setHealthStats({
          totalDistance: Number(res[0]),
          totalSteps: Number(res[1]),
          burnedCalories: Number(res[2]),
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
        <LineChart
          series={[
            {
              label: "Covered distance (km)",
              data: chartInfo.map((item) => item.distance),
            },
          ]}
          width={1500}
          height={600}
          grid={{ vertical: true, horizontal: true }}
        />
        <h3>Distance dynamics</h3>
      </div>
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
          valueMax={10000}
          startAngle={-90}
          endAngle={90}
        />
        <h3>Total Steps</h3>
      </div>
    </div>
  );
};
