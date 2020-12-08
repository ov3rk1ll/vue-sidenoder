import path from "path";
import { tmpdir } from "os";

const mountFolder = path.resolve(tmpdir() + "/mnt");

export default {
  mountFolder,
  win: null,
  rcloneRoot: "WHITEWHIDOW_QUEST",
  adb: null,
  device: null,
};
