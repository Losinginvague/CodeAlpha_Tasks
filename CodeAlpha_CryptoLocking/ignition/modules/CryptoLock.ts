import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CryptoLockModule = buildModule("CryptoLockModule", (m) => {
  const cryptoLock = m.contract("CryptoLock");

  return {
    cryptoLock,
  };
});

export default CryptoLockModule;