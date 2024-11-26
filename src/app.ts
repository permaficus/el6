import { request } from 'http';
import { generateRandomIp, randomIpFromList } from './helper/ipgenerator';
import { API_KEY, API_SECRET, TARGET_URL } from './constant/config';

// Configuration
const options = {
    // Target RPS
    rate: 200,
    // Number of concurrent workers
    preAllocatedVUs: 100,
};

// Headers for the requests
const headers = {
    'x-api-key': API_KEY,
    'x-api-secret': API_SECRET,
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://olx.co.id',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
};

// Tracking variables
let totalRequests = 0;
const startTime = Date.now();

// Function to send a single request
function sendRequest(IP: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const url = new URL(`${TARGET_URL}?ip=${IP}`);
        const req = request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET',
                headers,
            },
            (res) => {
                if (res.statusCode === 200) {
                    totalRequests++;
                    console.log(`Request success -> IP: ${IP}`);
                } else if (res.statusCode === 429) {
                    console.log('Rate limit exceeded.');
                } else {
                    console.error(`Request failed. Status: ${res.statusCode}`);
                }
                // Consume response data to free up memory
                res.on('data', () => {});
                res.on('end', resolve);
            }
        );

        req.on('error', (error) => {
            console.error(`Request error: ${error.message}`);
            reject(error);
        });

        req.end();
    });
}

// Worker function
async function worker(requestsPerSecond: number) {
    const delay = 1000 / requestsPerSecond; // Delay between requests in ms
    while (true) {
        const IP = randomIpFromList();
        try {
            await sendRequest(IP);
        } catch (error) {
            console.error(`Worker error: ${error.message}`);
        }
        // Controlled delay
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}

// Main function
async function loadTest() {
    console.log(`Starting load test with ${options.preAllocatedVUs} workers at ${options.rate} RPS.`);
    // Requests per second per worker
    const { rate, preAllocatedVUs } = options;
    const requestsPerWorker = rate / preAllocatedVUs

    // Start workers
    const workers = Array.from({ length: options.preAllocatedVUs }, () => worker(requestsPerWorker));

    // Periodically log statistics
    const statsInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const currentRPS = (totalRequests / elapsedSeconds).toFixed(2);
        console.log(`Elapsed: ${elapsedSeconds.toFixed(2)}s | Total Requests: ${totalRequests} | RPS: ${currentRPS}`);
    }, 1000);

    // Graceful shutdown handler
    process.on('SIGINT', () => {
        clearInterval(statsInterval);
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const avgRequestsPerMinute = (totalRequests / elapsedSeconds) * 60;
        console.log(`\n--- Final Stats ---`);
        console.log(`Total Requests: ${totalRequests}`);
        console.log(`Total Duration: ${elapsedSeconds.toFixed(2)} seconds`);
        console.log(`Average Requests per Minute: ${avgRequestsPerMinute.toFixed(2)}`);
        process.exit(0);
    });

    await Promise.all(workers);
}

// Start load test
loadTest().catch((err) => console.error(`Load test error: ${err.message}`));
