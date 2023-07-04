// adapted from https://tauri.app/v1/guides/testing/webdriver/example/selenium

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create the path to the expected application binary
const application = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "target",
    "release",
    "StackBaker"
);

// keep track of the webdriver instance we create
let driver;

// keep track of the tauri-driver process we start
let tauriDriver;

before(async function () {
    // set timeout to 2 minutes to allow the program to build if it needs to
    this.timeout(120000);

    // ensure the program has been built
    spawnSync('cargo', ['build', '--release']);

    // start tauri-driver
    tauriDriver = spawn(
        path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
        [],
        { stdio: [null, process.stdout, process.stderr] }
    );

    const capabilities = new Capabilities();
    capabilities.set('tauri:options', { application });
    capabilities.setBrowserName('wry');

    // start the webdriver client
    driver = await new Builder()
        .withCapabilities(capabilities)
        .usingServer('http://127.0.0.1:4444/')
        .build();
})

after(async function () {
    // stop the webdriver session
    await driver.quit();

    // kill the tauri-driver process
    tauriDriver.kill();
})

describe('Hello Tauri', () => {
	it('should be 4', async () => {
		const text = 4;
		expect(text).to.equal(4);
	})
})