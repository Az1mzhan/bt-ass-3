import GeoInfoModel from "./models/GeoInfo";
import User from "./models/User";
import cors from "cors";
import { readFileSync } from "fs";
import express, { Request, Response } from "express";
import {
  Coordinates,
  CoordinatesGenerator,
  GeoInfo,
} from "./features/CoordinatesGenerator";
import * as mongoose from "mongoose";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

const cityCoords: Coordinates = {
  latitude: Number(process.env.LATITUDE),
  longitude: Number(process.env.LONGITUDE),
};

const generator: CoordinatesGenerator = new CoordinatesGenerator(cityCoords);

app.post("/contract", (req: Request, res: Response) => {
  try {
    const { contractName } = req.body;

    const rawData = readFileSync(`./build/contracts/${contractName}.json`);
    const data = JSON.parse(rawData.toString());

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
  }
});

app.get("/stream-geo-info", (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendGeoInfo = async () => {
      generator.generateWalkingCoordinates();

      const geoInfo: GeoInfo = generator.getGeoInfo();

      const geoInfoRecord = new GeoInfoModel({
        coords: {
          latitude: geoInfo.coords.latitude,
          longitude: geoInfo.coords.longitude,
        },
        distance: geoInfo.distance,
      });
      await geoInfoRecord.save();

      res.status(200).write(`data: ${JSON.stringify(geoInfo)}\n\n`);
    };

    const intervalId = setInterval(sendGeoInfo, 10000);

    req.on("close", () => {
      clearInterval(intervalId);
      res.end();
    });
  } catch (err) {
    console.error(err);
  }
});

app.get("/chart-info", async (req: Request, res: Response) => {
  try {
    const geoInfoArray = await GeoInfoModel.find({}).limit(10);

    res.status(200).send(geoInfoArray);
  } catch (err) {
    console.error(err);
  }
});

// DEPRECATED ENDPOINT
app.post("/register-user", async (req: Request, res: Response) => {
  try {
    const { email, name, surname, birthdate, height, weight, gender } =
      req.body;

    const user = new User({
      email: email,
      name: name,
      surname: surname,
      birthdate: birthdate,
      height: height,
      weight: weight,
      gender: gender,
    });
    await user.save();

    res.status(200).send({ msg: "User has been successfully saved" });
  } catch (err) {
    console.error(err);
  }
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI);

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
};

await startServer();
