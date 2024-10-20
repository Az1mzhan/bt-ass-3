import cors from "cors";
import { readFileSync } from "fs";
import express, { Request, Response } from "express";
import {
  Coordinates,
  CoordinatesGenerator,
} from "./features/CoordinatesGenerator";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

const cityCoords: Coordinates = {
  latitude: 51.169392,
  longitude: 71.449074,
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
    throw new Error(err);
  }
});

app.get("/stream-distance", (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Function to send new coordinates
    const sendGeoInfo = () => {
      generator.generateWalkingCoordinates(0.1); // Generate next point (100 meters max step)
      const coordsObject = {
        currCoords: generator.getCurrentCoordinates(),
        distance: generator.calculateDistance(),
      };

      // Send the data as an SSE event
      res.status(200).write(`data: ${JSON.stringify(coordsObject)}\n\n`);
    };

    // Send new coordinates every 10 seconds
    const intervalId = setInterval(sendGeoInfo, 10000);

    // If client closes the connection, stop sending updates
    req.on("close", () => {
      clearInterval(intervalId);
      res.end();
    });
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
