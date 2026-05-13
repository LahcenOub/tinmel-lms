import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3001/');
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("CONTENT LENGTH:", text.length);
  } catch (e) {
    console.error("Fetch request failed.");
  }
}
test();
