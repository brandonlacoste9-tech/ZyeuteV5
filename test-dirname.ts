console.log("import.meta.dirname:", import.meta.dirname);
import path from "path";
try {
  console.log(
    "Resolved:",
    path.resolve(import.meta.dirname || "UNDEFINED", ".."),
  );
} catch (e) {
  console.error(e);
}
