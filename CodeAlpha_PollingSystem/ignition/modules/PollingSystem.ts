import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PollingSystemModule", (m) => {
  const pollingSystem = m.contract("PollingSystem");

  return { pollingSystem };
});