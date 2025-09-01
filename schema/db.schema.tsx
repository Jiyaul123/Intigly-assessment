// src/schema/db.schema.ts
import { ObjectSchema } from "realm";

export const StrokePointSchema: ObjectSchema = {
  name: "StrokePointSchema",
  embedded: true,
  properties: {
    x: { type: "double" },
    y: { type: "double" },
    tMillis: { type: "int", optional: true },
  },
};

export const JPUserSchema: ObjectSchema = {
  name: "JPUser",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", default: "" },
    remoteId: { type: "int", indexed: true },
    name: { type: "string", default: "" },
    email: { type: "string", default: "" },
    createdAt: { type: "string", default: "" },
  },
};

export const VideoSchema: ObjectSchema = {
  name: "VideoData",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", default: "" },
    uri: { type: "string", default: "", indexed: true },
    title: { type: "string", default: "" },
    durationMillis: { type: "int", optional: true },
    createdAt: { type: "string", default: "" },
  },
};

export const AnnotationSessionSchema: ObjectSchema = {
  name: "AnnotationSession",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", default: "" },
    userId: { type: "string", default: "", indexed: true },
    videoId: { type: "string", default: "", indexed: true },
    createdAt: { type: "string", default: "" },
    updatedAt: { type: "string", default: "" },
  },
};

export const CommentSchema: ObjectSchema = {
  name: "CommentData",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", default: "" },
    sessionId: { type: "string", default: "", indexed: true },
    text: { type: "string", default: "" },
    tMillis: { type: "int", default: 0, indexed: true },
    createdAt: { type: "string", default: "" },
  },
};

export const StrokeSchema: ObjectSchema = {
  name: "StrokeData",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", default: "" },
    sessionId: { type: "string", default: "", indexed: true },
    tStartMillis: { type: "int", default: 0, indexed: true },
    tEndMillis: { type: "int", optional: true },
    color: { type: "string", default: "#FF4B4B" },
    width: { type: "int", default: 3 },
    d: { type: "string", default: "" },
    points: { type: "list", objectType: "StrokePointSchema" }, // <-- must match name above
    createdAt: { type: "string", default: "" },
  },
};

export const LocalSchemas = [
  JPUserSchema,
  VideoSchema,
  AnnotationSessionSchema,
  CommentSchema,
  StrokeSchema,
  StrokePointSchema, // <-- include the embedded schema
];
