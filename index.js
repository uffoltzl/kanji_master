const axios = require('axios');
const cheerio = require('cheerio');
const escapeStringRegexp = require('escape-string-regexp');
const fs = require('fs');
const JishoApi = require('unofficial-jisho-api');
const jisho = new JishoApi();

let words = [];
let kanjis = [];
let subSetWords = [];
let page = 1;
let isKanjiValidResponse = false;
let isAllN5 = true;
let isAllN4 = true;
let isAllN3 = true;
let pass = 0;

const NB_PAGES_WORD_N4 = Math.ceil(578 / 20) + 1;
const NB_PAGES_KANJI_N4 = Math.ceil(166 / 20) + 1;
const NB_PAGES_WORD_N5 = Math.ceil(657 / 20) + 1;
const NB_PAGES_KANJI_N5 = Math.ceil(79 / 20) + 1;
const NB_PAGES_WORD_N3 = Math.ceil(1779 / 20) + 1;
const NB_PAGES_KANJI_N3 = Math.ceil(367 / 20) + 1;

function getStringBetweenStrings(data, startString, endString) {
    const regex = new RegExp(`${escapeStringRegexp(startString)}(.*?)${escapeStringRegexp(endString)}`, 'g');
    const match = data.match(regex);
    return match;
}

const getPageWord = async (level, page) => {
    const link = `https://jisho.org/search/%23${level}%20%23words?page=${page}`;
    await axios.get(link).then(response => {
        const $ = cheerio.load(response.data);
        const pageWords = $("span.text").text().split('\n');
        pageWords.forEach(word => {
            parsedWord = word.replace(/\s/g, '');
            if(parsedWord !== '' && parsedWord !== 'Words'){
                words.push(parsedWord);
            }
        });
    });
}

const getPageKanji = async (level, page) => {
    const link = `https://jisho.org/search/%23${level}%20%23kanji?page=${page}`;
    await axios.get(link).then(response => {
        let pageKanjis = getStringBetweenStrings(response.data, '<span class="character literal japanese_gothic" lang="ja">', '</span>');
        for(index in pageKanjis) {
            let kanji = pageKanjis[index];
            kanji = kanji.replace('</a></span>', '');
            kanji = kanji.slice(kanji.lastIndexOf('>'), kanji.length);
            kanjis.push(kanji);
        }
    });
}

const isKanjiValid = async (kanji) => {
    await jisho.searchForKanji(kanji).then(result => {
        if(result.found){
            if(result.jlptLevel === "N3"){
                isKanjiValidResponse = true;
                isAllN4 = false;
                isAllN5 = false
            }
            if(result.jlptLevel === "N4"){
                isKanjiValidResponse = true;
                isAllN3 = false;
                isAllN5 = false;
            }
            if(result.jlptLevel === "N5"){
                isKanjiValidResponse = true;
                isAllN3 = false;
                isAllN4 = false;
            }
        }
        else {
            pass += 1;
            isKanjiValidResponse = true;
        }
    }).catch(error => {
        console.log(error);
        console.log(kanji);
    });
}

const isAllKanjisValid = async (subKanjis) => {
    for(index in subKanjis){
        await isKanjiValid(subKanjis[index]);
        if(!isKanjiValidResponse){
            return false;
        }
        isKanjiValidResponse = false;
    }
    if(pass === subKanjis.length){
        return false;
    }
    return true;
}

(async () => {
    console.log("Collect all N5 words");
    while(page < NB_PAGES_WORD_N5){
        await getPageWord('jlpt-n5', page);
        page += 1;    
    }

    console.log("Collect all N3 kanjis");
    page = 1;
    while(page < NB_PAGES_KANJI_N3){
        await getPageKanji('jlpt-n3', page);
        page += 1;    
    }

    console.log("Collect all N4 kanjis");
    page = 1;
    while(page < NB_PAGES_KANJI_N4){
        await getPageKanji('jlpt-n4', page);
        page += 1;    
    }

    console.log("Collect all N5 kanjis");
    page = 1;
    while(page < NB_PAGES_KANJI_N5){
        await getPageKanji('jlpt-n5', page);
        page += 1;    
    }

    console.log("Check wheather N5 words are composed by N3 and N4 and N5 kanjis");
    for(index in words){
        const word = words[index];
        const subKanjis = word.split('');
        if(subKanjis.length < 3) {
            continue;
        }
        if(await isAllKanjisValid(subKanjis)){
            if(!isAllN3 && !isAllN4 && !isAllN5){
                subSetWords.push(word);
            }
            isAllN4 = true;
            isAllN3 = true;
            isAllN5 = true;
        }
        pass = 0;
    }

    console.log("Results");
    fs.writeFile('N5W_N3_N4_N5K.txt', subSetWords, (err) => {
        if (err) throw err;
    })
})();

