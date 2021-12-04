const fs = require('fs');
console.log('ok');
const main = document.getElementById('main');
fs.readFile("N5.txt", (err, data) => {
    if (err) {
        throw err;
    }
    main.innerHTML = data;
})