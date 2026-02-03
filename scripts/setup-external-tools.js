#!/usr/bin/env node
"use strict";
const path = require("path");
const { execSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const cmd = isWin
  ? `powershell -ExecutionPolicy Bypass -File "${path.join(root, "scripts", "setup-external-tools.ps1")}"`
  : `bash "${path.join(root, "scripts", "setup-external-tools.sh")}"`;
execSync(cmd, { stdio: "inherit", cwd: root });
