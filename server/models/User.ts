import { Schema, model } from "mongoose";

const schemaOptions = { timestamps: true };

const UserSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    birthdate: { type: Date, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    gender: { type: Boolean, required: true },
  },
  schemaOptions
);

export default model("User", UserSchema);
