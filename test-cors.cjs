const https = require('https');

async function testCors() {
  try {
    const res = await fetch("https://dns.google/resolve?name=example.com&type=A", {
      headers: { "accept": "application/dns-json" }
    });
    console.log("Status:", res.status);
    console.log("CORS Header:", res.headers.get("access-control-allow-origin"));
    const data = await res.json();
    console.log("Data:", data.Status);
  } catch (e) {
    console.error(e);
  }
}

testCors();
