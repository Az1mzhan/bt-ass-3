import { Schema, model } from "mongoose";

const schemaOptions = { timestamps: true };

const CoordinatesSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const GeoInfoSchema = new Schema(
  {
    coords: { type: CoordinatesSchema, required: true },
    distance: { type: Number, required: true },
  },
  schemaOptions
);

export default model("GeoInfo", GeoInfoSchema);
