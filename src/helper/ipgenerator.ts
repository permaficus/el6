/**
 * Generate random IP Public for Testing only
 * @returns random ip public
 */
export function generateRandomIp(): string {
    // Generate each octet (byte) of the IPv4 address
    const randomOctet = () => Math.floor(Math.random() * 255);
  
    let ip: string;
  
    do {
      ip = `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`;
    } while (!isValidPublicIp(ip));
  
    return ip;
  }
  
function isValidPublicIp(ip: any) {
    const privateRanges = [
      /^10\./,                     // 10.0.0.0/8
      /^127\./,                    // 127.0.0.0/8
      /^169\.254\./,               // 169.254.0.0/16
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
      /^192\.168\./,               // 192.168.0.0/16
      /^0\./,                      // 0.0.0.0/8 (reserved)
      /^255\./                     // 255.0.0.0/8 (reserved)
    ];
  
    // Check if the IP matches any of the private or reserved ranges
    return !privateRanges.some(range => range.test(ip));
}