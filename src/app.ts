import axios from 'axios';
import { IPs } from "@/constant/ip";
import { generateRandomIp } from './helper/ipgenerator';

// Helper function to get a random IP from a list
function getRandomIP(ips: string[]): string {
    return ips[Math.floor(Math.random() * ips.length)];
}

// Configuration options
const options = {
    rate: 20,         // Target RPS
    preAllocatedVUs: 200, // Number of concurrent workers
};

// Simulated sleep function
function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Headers for the requests
const headers = {
    'x-api-key': 'ak_0682f68dcc21ec672013b4d49b28f8b6b0319b7a52b8060cff3f042f0c88884e',
    'x-api-secret': 'as_42543e58a649d12663761cfaf73b4970178231fbd2297904fb20c624df77940a',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://olx.co.id',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
};

// Main load testing function
async function loadTest() {
    const url = 'http://localhost:3501/api/v1/lookup'; // Replace with your API endpoint

    const workers: Promise<void>[] = [];
    
    // Create pre-allocated VUs
    for (let i = 0; i < options.preAllocatedVUs; i++) {
        workers.push(worker(url, generateRandomIp()));
    }

    console.log(`Load test started with ${options.preAllocatedVUs} workers.`);
    console.log(`Press Ctrl+C to stop the test.`);

    // Wait for all workers to run indefinitely
    await Promise.all(workers);
}

// Worker function that sends requests in an infinite loop
async function worker(url: string, IP: string) {
    while (true) {

        try {
            const response = await axios.get(`${url}?ip=${IP}`, { headers });

            // Perform checks on the response
            if (response.status === 200) {
                console.log(`Request successful: Status ${response.status}, IP: ${IP}`);
            } else {
                console.log(`Unexpected response status: ${response.status}, IP: ${IP}`);
            }
        } catch (error: any) {
            if (error.response) {
                if (error.response.status === 429) {
                    console.log('Rate limit exceeded.');
                } else {
                    console.error(`Request failed. Status: ${error.response.status}, IP: ${IP}`);
                }
            } else {
                console.error(`Error for IP: ${IP}`, error.message);
            }
        }

        // Simulate sleep between requests
        await sleep(1 / options.rate); // Adjust sleep time to match target RPS
    }
}

// Start the load test
loadTest().catch(err => console.error('Load test encountered an error:', err));
