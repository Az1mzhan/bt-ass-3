import { FC, useEffect, useRef } from "react";
import { GeoInfo } from "../../types/GeoInfo";
import { Placemark, YMaps, Map, ZoomControl } from "@pbe/react-yandex-maps";
import styles from "./geoInfoComponent.module.css";

interface Props {
  geoInfo: GeoInfo;
}

export const GeoInfoComponent: FC<Props> = ({ geoInfo }: Props) => {
  const mapRef = useRef<any>(null); // Create a ref to hold the map instance

  useEffect(() => {
    if (mapRef.current) {
      // Check if mapRef is set and update the center
      mapRef.current.setCenter([
        geoInfo.coords.latitude,
        geoInfo.coords.longitude,
      ]);
    }
  }, [geoInfo]); // Run this effect whenever geoInfo changes

  return (
    <>
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
            geometry={[geoInfo.coords.longitude, geoInfo.coords.latitude]}
          />
          <ZoomControl />
        </Map>
      </YMaps>
    </>
  );
};
