import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DualChannelVuMeter } from "./DualChannelVuMeter";
import { useAppStore } from "@/store/app";

describe("DualChannelVuMeter", () => {
  it("renders distinct dual-channel audio visualizers for mic and system audio", () => {
    useAppStore.setState({
      recState: "recording",
      vu: { mic: 0.65, system: 0.45 },
    });

    render(<DualChannelVuMeter />);

    expect(screen.getByLabelText("Dual-channel audio visualizer")).toBeDefined();
    expect(screen.getByTitle("Host Microphone Level")).toBeDefined();
    expect(screen.getByTitle("Remote Participants Audio Level")).toBeDefined();
  });
});
