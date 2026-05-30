import fs from "fs";
import path from "path";
import crypto from "crypto";

const IDENTITY_FILE = path.resolve(process.cwd(), "zyeute-identity.json");

/**
 * Generates an Ed25519 key pair for the Zyeuté Hive Identity.
 * This decentralizes trust, replacing Google API keys.
 */
function generateIdentity() {
  if (fs.existsSync(IDENTITY_FILE)) {
    console.log("Identity file already exists at:", IDENTITY_FILE);
    return;
  }

  console.log("Creating new Ed25519 Identity...");

  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    modulusLength: 4096, // Not used for Ed25519 but standard param
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  // We can also extract the raw bytes if needed for some libraries,
  // but PEM is standard for Node crypto.

  const identity = {
    publicKey: publicKey,
    privateKey: privateKey,
    created: new Date().toISOString(),
    algorithm: "Ed25519",
  };

  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
  console.log("✅ Identity generated!");
  console.log("Public Key:\n", publicKey);
}

generateIdentity();
