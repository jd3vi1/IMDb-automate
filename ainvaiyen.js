const path = require("path");

console.log(path.join("file:", __dirname, "watchNext.html"));

console.log(path.join("file:", "", __dirname, "watchNext.html"));
