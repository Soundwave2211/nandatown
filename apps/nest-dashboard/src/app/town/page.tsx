import type { Metadata } from "next";
import { TownSimulation } from "./town-simulation";

export const metadata: Metadata = {
  title: "Living Pixel Town - Nanda Town",
  description:
    "A cozy pseudo-3D pixel simulation of Nanda Town with AI agents walking through evaluation, training, benchmarking, certification, and deployment.",
};

export default function TownPage() {
  return <TownSimulation />;
}
