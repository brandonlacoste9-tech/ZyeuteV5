import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

class SentinelReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(
      `\n⚜️ [ZYEUTÉ SENTINEL] Starting Audit for ${suite.allTests().length} vectors...`,
    );
  }

  onTestBegin(test: TestCase) {
    console.log(`  🔍 Scanning: ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const status = result.status === "passed" ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status}: ${test.title} (${result.duration}ms)`);

    if (result.status !== "passed") {
      console.log(`     ⚠️ ERROR: ${result.error?.message?.split("\n")[0]}`);
    }
  }

  onEnd(result: FullResult) {
    console.log(
      `\n🏁 [SENTINEL] Audit Complete. Status: ${result.status.toUpperCase()}`,
    );
    if (result.status === "passed") {
      console.log(
        "🦁 The Hive is stable. Quebec's digital sovereignty is secure.",
      );
    } else {
      console.log(
        "🐺 ALERT: Security or Stability breaches detected. Consult the trace logs.",
      );
    }
  }
}

export default SentinelReporter;
