import { Metadata } from "next";
import { Arena } from "../components/Arena";

export const metadata = {
  title: "ShapeCraft Survivors Arena",
  description: "Prepare for Battle",
};

export default function ArenaPage() {
  return (
    <main className="container mx-auto">
      <Arena />
    </main>
  );
}
