async function testFetch() {
  const urls = [
    'https://www.nerdwallet.com/best/credit-cards/no-foreign-transaction-fee',
    'https://www.bankrate.com/credit-cards/no-foreign-transaction-fee/',
    'https://thepointsguy.com/credit-cards/best-no-foreign-transaction-fee/',
    'https://www.cnbc.com/select/best-no-foreign-transaction-fee-credit-cards/'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.log(`${url}: Error ${e.message}`);
    }
  }
}

testFetch();
