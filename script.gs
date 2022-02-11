// from https://www.nicehash.com/blog/post/nicehash-api-integration-with-google-spreadsheets-guide
function generateNonce() {
  var d = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
  });
}

// Headerの作成
function makeHeader(url) {
  eval(
    UrlFetchApp.fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js"
    ).getContentText()
  );
  eval(
    UrlFetchApp.fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/hmac-sha256.min.js"
    ).getContentText()
  );
  eval(
    UrlFetchApp.fetch(
      "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/enc-base64.min.js"
    ).getContentText()
  );

  var delim = "\u0000";
  var key = "key"; //Change this value to your custom key. Leave quotation marks.
  var secret = "secret"; //Change this value to your custom secret. Leave quotation marks.
  var org = "org"; //Change this value to your custom id. Leave quotation marks.
  var time = "" + new Date().getTime();
  var nonce = generateNonce();
  var reqMeth = "GET";
  var content =
    key +
    delim +
    time +
    delim +
    nonce +
    delim +
    delim +
    org +
    delim +
    delim +
    reqMeth +
    delim +
    url +
    delim;
  var HMACsig = CryptoJS.HmacSHA256(content, secret);
  var xServiceAuth = key + ":" + HMACsig;
  var headers = {
    "X-Nonce": nonce,
    "X-Time": time,
    "X-Auth": xServiceAuth,
    "X-Organization-Id": org,
  };
  return headers;
}

// 残高取得
function getBalance() {
  var url = "/main/api/v2/accounting/account2/BTC";
  var headers = makeHeader(url);
  var response = UrlFetchApp.fetch("https://api2.nicehash.com" + url, {
    headers: headers,
  });
  var content = response.getContentText();
  var obj = JSON.parse(content);
  return obj.totalBalance;
}

// マイナー系の情報取得
function getMinerStats() {
  var url = "/main/api/v2/mining/algo/stats";
  var headers = makeHeader(url);
  var response = UrlFetchApp.fetch("https://api2.nicehash.com" + url, {
    headers: headers,
  });
  var content = response.getContentText();
  var obj = JSON.parse(content);
  return obj;
}

// スプシ更新(これを定期実行する)
function updateSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");
  var balance = getBalance();
  var miner = getMinerStats();

  var algo = Object.keys(miner.algorithms)[0];
  var unpaid = miner.algorithms[algo].unpaid;
  var isActive = miner.algorithms[algo].isActive;

  // シートの一番下にデータをたす
  sheet.appendRow([
    new Date(),
    algo,
    Number(balance) + Number(unpaid),
    isActive,
  ]);
}
