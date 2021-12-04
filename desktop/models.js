class Word {
    constructor(word, jlptLevel){
        this.word = word;
        this.jlptLevel = jlptLevel;
        this.kanjiLevel = 'N0'
    }

    addKanjiLevel(kanjiLevel){
        this.kanjiLevel = kanjiLevel;
    }
}

class Kanji {
    constructor(kanji, jlptLevel){
        this.kanji = kanji;
        this.jlptLevel = jlptLevel;
    }
}

const convertLevel = (level) => {
    switch(level){
        case 'jlpt-n5': return 'N5';
        case 'jlpt-n4': return 'N4';
        case 'jlpt-n3': return 'N3';
        default: return 'N0';
    }
}