export function getOption(
  args: string[],
  name: string,
  defaultValue: string | boolean,
  opts: { isBoolean?: boolean } = {}
) {
  const option = `--${name}`;
  if (args.includes(option)) {
    if (opts.isBoolean && args[args.indexOf(option) + 1] !== "false") {
      return true;
    }

    const value = args[args.indexOf(option) + 1];

    if (!value || value.startsWith("--")) {
      console.log("WARN: Missing value for option", option);
      process.exit(1);
    }
    return value;
  }
  return defaultValue;
}
