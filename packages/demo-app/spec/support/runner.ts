import Jasmine from "jasmine";
import {
  DisplayProcessor,
  SpecReporter,
  StacktraceOption,
} from "jasmine-spec-reporter";
import SuiteInfo = jasmine.SuiteInfo;

const jasmine = new Jasmine({});

jasmine.loadConfigFile("spec/support/jasmine.json");
jasmine.configureDefaultReporter({
  showColors: false,
});

class CustomProcessor extends DisplayProcessor {
  public displayJasmineStarted(info: SuiteInfo, log: string): string {
    return `TypeScript ${log}`;
  }
}

jasmine.clearReporters();
jasmine.addReporter(
  new SpecReporter({
    spec: {
      displayStacktrace: StacktraceOption.NONE,
    },
    customProcessors: [CustomProcessor],
  })
);

jasmine.execute();
