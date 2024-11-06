import { FC, useEffect, useRef, useState } from "react";
import { Coordinates, GeoInfo } from "../../types/GeoInfo";
import { Placemark, YMaps, Map, ZoomControl } from "@pbe/react-yandex-maps";
import styles from "./geoInfoComponent.module.css";

interface Props {
  geoInfo: GeoInfo;
}

export const GeoInfoComponent: FC<Props> = ({ geoInfo }: Props) => {
  const [placemarkCoords, setPlacemarkCoords] = useState<Coordinates>({
    latitude: 0,
    longitude: 0,
  });
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter([
        geoInfo.coords.latitude,
        geoInfo.coords.longitude,
      ]);

      setPlacemarkCoords({
        latitude: geoInfo.coords.latitude,
        longitude: geoInfo.coords.longitude,
      });
    }
  }, [geoInfo]);

  return (
    <div className={styles.geoInfo}>
      <div className={styles.dataContainer}>
        <div className="dataCell">
          <h3>Latitude: </h3>
          <span>{Number(geoInfo.coords.latitude)}</span>
        </div>
        <div className="dataCell">
          <h3>Longitude: </h3>
          <span>{geoInfo.coords.longitude}</span>
        </div>
        <div className="dataCell">
          <h3>Recent covered distance: </h3>
          <span>{geoInfo.distance} km</span>
        </div>
        <p className={styles.note}>Note: Geo info updates every 10 seconds</p>
      </div>
      <YMaps>
        <Map
          className={styles.map}
          defaultState={{
            center: [geoInfo.coords.longitude, geoInfo.coords.latitude],
            zoom: 17,
          }}
          instanceRef={mapRef}
        >
          <Placemark
            geometry={[placemarkCoords.longitude, placemarkCoords.latitude]}
          />
          <ZoomControl />
        </Map>
      </YMaps>
    </div>
  );
};
