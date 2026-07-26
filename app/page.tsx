import type { Metadata } from "next";
import { FoodBridgeApp } from "./FoodBridgeApp";

export const metadata: Metadata = {
  title: "FoodBridge Live AI | Team 1m1beeys",
  description:
    "Predict surplus, track it live, and coordinate safe food recovery before the collection window closes.",
  openGraph: {
    title: "FoodBridge Live AI",
    description: "Predict surplus. Track it live. Recover food before it becomes waste.",
    images: ["/og.png"],
  },
};

export default function Home() {
  return <FoodBridgeApp />;
}
