enchant();
// CONSTANTS
const GAME_SCREEN_WIDTH = 696
const GAME_SCREEN_HEIGHT = 560

const AMOUNT_BOARD_CARD_WIDTH = 100
const AMOUNT_BOARD_CARD_HEIGHT = 30
const AMOUNT_BOARD_CARD_LABEL_OFFSET_X = 0
const AMOUNT_BOARD_CARD_LABEL_OFFSET_Y = 10
const AMOUNT_BOARD_WIDTH = 100
const AMOUNT_BOARD_HEIGHT = 13 * (AMOUNT_BOARD_CARD_HEIGHT + 5)
const LEFT_AMOUNT_BOARD_X = 5
const LEFT_AMOUNT_BOARD_Y = 5
const RIGHT_AMOUNT_BOARD_X = GAME_SCREEN_WIDTH - AMOUNT_BOARD_CARD_WIDTH - 5
const RIGHT_AMOUNT_BOARD_Y = 5

const CASES_AREA_X = 130
const CASES_AREA_Y = 80

const CASE_WIDTH = 64
const CASE_HEIGHT = 64
const CASE_LABEL_FONT_SIZE = '24px'
const CASE_LABEL_OFFSET_X = 20
const CASE_LABEL_OFFSET_Y = 20

const ROUND_LABEL_X = 330
const ROUND_LABEL_Y = 10

const TOP_MESSAGE_X = 180
const TOP_MESSAGE_X_OFFSET = TOP_MESSAGE_X - 30
const TOP_MESSAGE_Y = 30
const TOP_MESSAGE_FONT_SIZE = '24px'
const TOP_MESSAGE_WIDTH = 600

const BANK_OFFER_MESSAGE_X = 260
const BANK_OFFER_MESSAGE_Y = 440
const BANK_OFFER_MESSAGE_COLOR = "yellow"

const CURRENT_CASE_VALUE_X = 300
const CURRENT_CASE_VALUE_Y = 300

const CHOSEN_INITIAL_CASE_X = 10
const CHOSEN_INITIAL_CASE_Y = 500

const AMOUNT_CARD_PER_BOARD = 13

const DEAL_BUTTON_X = 120
const DEAL_BUTTON_Y = 450
const DEAL_BUTTON_WIDTH = 128
const DEAL_BUTTON_HEIGHT = 128
const NO_DEAL_BUTTON_X = 420
const NO_DEAL_BUTTON_Y = 450
const NO_DEAL_BUTTON_WIDTH = 128
const NO_DEAL_BUTTON_HEIGHT = 128

const PAY_OUTS = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750,
    1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000,
    400000, 500000, 750000, 1000000
]
const NUM_CASES = PAY_OUTS.length
const CASE_XY_LOCATIONS = []
const MAX_CASES_PER_ROUND = [6, 5, 4, 3, 2, 1, 1, 1, 1, 1]

const CASE_IMAGE = "assets/case.png"
const MAIN_GAME_BG_IMAGE = "assets/mainGameBG.png"
const WHITE_BG_IMAGE = "assets/whiteBG.png"
const OPENED_CASE_BG_IMAGE = "assets/model.png"
const OPENED_CASE_MODEL_SAD_BG_IMAGE = "assets/modelSad.png"
const BANKER_OFFER_BG_IMAGE = "assets/bankerOfferBG.png"
const DEAL_BUTTON_IMAGE = "assets/dealButton.png"
const NO_DEAL_BUTTON_IMAGE = "assets/nonDealButton.png"
const AMOUNT_CARD_IMAGE = "assets/amountCard.png"
const END_GAME_WIN_IMAGE = "assets/endGameWin.png"
const END_GAME_LOSE_IMAGE = "assets/endGameLose.png"

const TEXT_FONT = "Eurostile"

// LIBRARY
function shuffle(array) {
    let tempArray = [];
    array.forEach((item) => {
        tempArray.push(item);
    })

    let currentIndex = tempArray.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [tempArray[currentIndex], tempArray[randomIndex]] = [
        tempArray[randomIndex], tempArray[currentIndex]];
    }
  
    return tempArray;
}

function getBankerOfferSafe(offerPercent, cases) {
    let caseValues = []
    cases.forEach((currentCase) => {
        caseValues.push(Math.pow(currentCase.value, 2))
    })
    return (offerPercent * Math.sqrt((caseValues.reduce((a, b) => a + b, 0) / caseValues.length)))
}

function getBankerOffer(offerPercent, cases) {
    // https://commcognition.blogspot.com/2007/06/deal-or-no-deal-bankers-formula.html
    let caseValues = []
    cases.forEach((currentCase) => {
        caseValues.push(currentCase.value)
    })
    const M = Math.max(...caseValues)
    const E = caseValues.reduce((a, b) => a + b, 0) / caseValues.length
    const C = caseValues.length
    const offer = 12275.30 + (0.748 * E) - (2714.74 * C) - (0.040 * M) + (0.0000006986 * Math.pow(E, 2)) + (32.623 * Math.pow(C, 2))
    if (offer < 0 || offer > M) return getBankerOfferSafe(offerPercent, cases)
    else return offer
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function makeBackground(image, width, height) {
    const bg = new Sprite(width, height);
    bg.image = image;
    return bg;
}

// GAME OBJECTS
const DealOrNoDeal = Class.create(Object, {
    initialize: function() {
        this.initGame();
    },

    initGame: function() {
        this.cleanUp()

        // create cases
        this.cases = this.initCases();

        // data
        this.initialChosenCase = null;
        this.round = 0;
        this.casesOpenedThisRound = 0;
        this.casesOpenedTotal = 0;
        this.offerPercent = 0.05;
        this.offerIncrement = 0.125;
        this.bankerOffer = 0;
        this.roundEnded = false;
        this.currentOpenedCaseValue = 0;
        this.numberCasesToChoose = 0;
        this.endGameScene = null;

        // objects
        this.leftAmountBoard = new AmountBoard(LEFT_AMOUNT_BOARD_X, LEFT_AMOUNT_BOARD_Y);
        this.rightAmountBoard = new AmountBoard(RIGHT_AMOUNT_BOARD_X, RIGHT_AMOUNT_BOARD_Y);
        
        // labels
        this.numberCasesToChooseLabel = new NumberCasesToChooseLabel(TOP_MESSAGE_X, TOP_MESSAGE_Y)
        // this.currentGameRoundLabel = new GameRoundLabel(ROUND_LABEL_X, ROUND_LABEL_Y)
        
        // make scene
        this.mainGameScene = this.makeMainGameScene();
        game.pushScene(this.mainGameScene);
    },

    cleanUp: function() {
        if (this.cases) {
            this.cases.forEach((currentCase) => {
                if (currentCase) {
                    currentCase.label.remove();
                    currentCase.remove();
                }
            })
        }
        if (this.initialChosenCase) this.initialChosenCase.remove()
        // if (this.currentGameRoundLabel) this.currentGameRoundLabel.remove()
        if (this.numberCasesToChooseLabel) this.numberCasesToChooseLabel.remove()
        if (this.leftAmountBoard) this.leftAmountBoard = null
        if (this.rightAmountBoard) this.rightAmountBoard = null

        if (this.endGameScene) game.removeScene(this.endGameScene);
    },

    initCases: function() {
        const randomizedCaseValues = shuffle(PAY_OUTS);
        let cases = [];
        let caseIdx = 0
        for (let y = 3; y > -1; y--) {
            let rowEnd = 7
            let xOffset = 0
            if (y == 1 || y == 2) {
                rowEnd = 8
                xOffset = 30
            }
            for (let x = 0; x < rowEnd - 1; x++) {
                const caseX = CASES_AREA_X + x * CASE_WIDTH * 1.1 - xOffset;
                const caseY = CASES_AREA_Y + y * CASE_HEIGHT * 1.25;
                const cashCase = new Case(caseX, caseY, caseIdx + 1, randomizedCaseValues[caseIdx++], this);
                cases.push(cashCase);
            }
        }
        return cases
    },

    removeAmountFromBoard: function(caseAmount) {
        if (caseAmount <= 750) {
            this.leftAmountBoard.removeCard(caseAmount)
        } else {
            this.rightAmountBoard.removeCard(caseAmount)
        }
    },

    makeMainGameScene: function() {
        const scene = new Scene();

        // background creation
        const bg = makeBackground(game.assets[MAIN_GAME_BG_IMAGE], GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT)
        scene.addChild(bg);

        // populate        
        // objects
        this.leftAmountBoard.initializeCards(PAY_OUTS.slice(0, Math.floor(PAY_OUTS.length / 2)), scene)
        this.rightAmountBoard.initializeCards(PAY_OUTS.slice(Math.floor(PAY_OUTS.length / 2), PAY_OUTS.length), scene)

        // sprites
        this.cases.forEach((currentCase) => {
            scene.addChild(currentCase)
            scene.addChild(currentCase.label)
        })

        // labels
        scene.addChild(this.numberCasesToChooseLabel);
        // scene.addChild(this.currentGameRoundLabel);
        
        return scene
    },
    
    makeOpenCaseResultScene: function() {
        const scene = new Scene();
        
        const bg = makeBackground(this.currentOpenedCaseValue >= 10000 ? game.assets[OPENED_CASE_MODEL_SAD_BG_IMAGE] : game.assets[OPENED_CASE_BG_IMAGE], GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT)
        bg.addEventListener(Event.TOUCH_START, function(e) {
            game.popScene();
        });
        
        const currentOpenedCaseValue = new CurrentChosenCaseLabel(CURRENT_CASE_VALUE_X, CURRENT_CASE_VALUE_Y)
        currentOpenedCaseValue.change(this.currentOpenedCaseValue)

        scene.addChild(bg);
        scene.addChild(currentOpenedCaseValue);

        return scene;
    },

    makeBankOfferDealNoDealScene: function() {
        const scene = new Scene();
        
        const bg = makeBackground(game.assets[BANKER_OFFER_BG_IMAGE], GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT)
        
        const currentBankOfferLabel = new BankOfferLabel(BANK_OFFER_MESSAGE_X, BANK_OFFER_MESSAGE_Y);
        currentBankOfferLabel.change(this.bankerOffer)

        const dealButton = new DealButton(DEAL_BUTTON_X, DEAL_BUTTON_Y, this)
        const noDealButton = new NoDealButton(NO_DEAL_BUTTON_X, NO_DEAL_BUTTON_Y, this)

        scene.addChild(bg);
        scene.addChild(currentBankOfferLabel);
        scene.addChild(dealButton);
        scene.addChild(noDealButton);

        return scene;
    },

    makeEndGameScene: function(deal) {
        const scene = new Scene();

        let won = false;
        let bg;
        if (deal & this.initialChosenCase.value < this.bankerOffer) won = true
        else if (!deal & this.initialChosenCase.value > this.bankerOffer) won = true
        
        if (won) {
            bg = makeBackground(game.assets[END_GAME_WIN_IMAGE], GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT)
        } else {
            bg = makeBackground(game.assets[END_GAME_LOSE_IMAGE], GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT)
        }
        bg.dealGame = this;
        bg.addEventListener(Event.TOUCH_START, function(e) {
            this.dealGame.initGame();
        });

        const currentBankOfferLabel = new BankOfferLabel(130, 260);
        currentBankOfferLabel.change(this.bankerOffer)
        const currentOpenedCaseValue = new CurrentChosenCaseLabel(430, 260)
        currentOpenedCaseValue.font = currentBankOfferLabel.font
        currentOpenedCaseValue.color = "purple"
        currentOpenedCaseValue.change(this.initialChosenCase.value)
        
        scene.addChild(bg);
        scene.addChild(currentBankOfferLabel);
        scene.addChild(currentOpenedCaseValue);

        return scene;
    },

    endGame: function(deal) {
        this.endGameScene = this.makeEndGameScene(deal)
        game.pushScene(this.endGameScene)
    },

    chooseInitialCase: function(chosenCase) {
        this.initialChosenCase = new Case(CHOSEN_INITIAL_CASE_X, CHOSEN_INITIAL_CASE_Y, chosenCase.id, chosenCase.value, this);
        this.initialChosenCase.ontouchend = () => {};
        this.mainGameScene.addChild(this.initialChosenCase);
        this.mainGameScene.addChild(this.initialChosenCase.label);

        this.numberCasesToChoose = MAX_CASES_PER_ROUND[this.round]
        this.numberCasesToChooseLabel.change(this.numberCasesToChoose)
    },
    
    chooseCaseNormal: function(chosenCase) {
        this.currentOpenedCaseValue = chosenCase.value;

        const caseIndex = this.cases.indexOf(chosenCase);
        this.cases.splice(caseIndex, 1);

        this.casesOpenedThisRound++;
        this.casesOpenedTotal++;

        this.numberCasesToChoose = MAX_CASES_PER_ROUND[this.round] - this.casesOpenedThisRound
        this.numberCasesToChooseLabel.change(this.numberCasesToChoose)

        this.removeAmountFromBoard(chosenCase.value)
        
        if (!this.roundEnded) {
            if (this.round == 9) { // round 10 is the last round
                this.endGame(false);
                game.pushScene(this.makeOpenCaseResultScene());
                return 
            }
            if (this.casesOpenedThisRound == MAX_CASES_PER_ROUND[this.round]) {
                this.bankerOffer = getBankerOffer(this.offerPercent, this.cases)
                this.numberCasesToChooseLabel.displayMessage("           DEAL OR NO DEAL?", null)
                this.offerPercent = this.offerPercent + this.offerIncrement;
                this.roundEnded = true;
                game.pushScene(this.makeBankOfferDealNoDealScene());
            }
        }

        game.pushScene(this.makeOpenCaseResultScene());
    },

    takeDeal: function() {
        if (this.roundEnded) {
            game.popScene();
            this.endGame(true);
        }
    },

    noDeal: function() {
        if (this.roundEnded) {
            this.round++;
            // this.currentGameRoundLabel.increment();
            if (this.round == 9) this.numberCasesToChooseLabel.displayMessage("PLEASE OPEN THE LAST CASE", null)
            else {
                this.numberCasesToChoose = MAX_CASES_PER_ROUND[this.round]
                this.numberCasesToChooseLabel.change(this.numberCasesToChoose)
            }

            this.casesOpenedThisRound = 0;
            this.roundEnded = false;
            this.currentOpenedCaseValue = 0;

            game.popScene();
        }
    },
});

const AmountBoard = Class.create(Object, {
    initialize: function(x, y) {
        this.x = x;
        this.y = y;
        this.amountBoardCards = [];
    },
    initializeCards: function(amounts, scene) {
        this.amountBoardCards = [];
        for (let amountBoardCardIdx = 0; amountBoardCardIdx < amounts.length; amountBoardCardIdx++) {
            let amountBoardCard = new AmountBoardCard(this.x, this.y + (AMOUNT_BOARD_CARD_HEIGHT * amountBoardCardIdx * 1.2), amounts[amountBoardCardIdx])
            scene.addChild(amountBoardCard);
            scene.addChild(amountBoardCard.label);
            this.amountBoardCards.push(amountBoardCard);
        }
    },
    removeCard: function(amount) {
        this.amountBoardCards.forEach((amountBoardCard) => {
            if (amountBoardCard.amount == amount) {
                amountBoardCard.remove();
                amountBoardCard.label.remove();
            }
        })
    }
})

const AmountBoardCard = Class.create(Sprite, {
    initialize: function(x, y, amount) { 
        Sprite.call(this, AMOUNT_BOARD_CARD_WIDTH, AMOUNT_BOARD_CARD_HEIGHT);
        this.image = game.assets[AMOUNT_CARD_IMAGE];
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.label = new AmountBoardCardLabel(x, y, amount);
    },
})

const AmountBoardCardLabel = Class.create(Label, {
    initialize: function(x, y, amount) {
        let amountText = numberWithCommas(amount)
        const pad = 15 - amountText.length
        for (let i = 0; i < pad; i++) {
            amountText = " ".concat(amountText)
        }
        amountText = "$".concat(amountText)
        Label.call(this, amountText)
        this.x = x + AMOUNT_BOARD_CARD_LABEL_OFFSET_X + (amount < 1000 ? -10 : 0);
        this.y = y + AMOUNT_BOARD_CARD_LABEL_OFFSET_Y;
        this.amount = amount;
        this.textAlign = 'right';
        this.font = '14px "Arial"'
        this.width = AMOUNT_BOARD_CARD_WIDTH - 7
    }
})

const Case = Class.create(Sprite, {
    initialize: function(x, y, id, value, dealGame) { 
        Sprite.call(this, CASE_WIDTH, CASE_HEIGHT);
        this.image = game.assets[CASE_IMAGE];
        this.x = x;
        this.y = y;
        this.id = id;
        this.value = value;
        this.dealGame = dealGame;
        this.label = new CaseLabel(x, y, id, this);
    },

    ontouchend: function() {
        if (!this.dealGame.roundEnded) {
            if (this.dealGame.initialChosenCase == null) {
                this.dealGame.chooseInitialCase(this);
                this.remove();
                this.label.remove();
            }
            else {
                this.dealGame.chooseCaseNormal(this);
                this.remove();
                this.label.remove();
            }
        }
    },

    reveal: function() {
        this.label.text = "$".concat(numberWithCommas(this.value))
    }
})

const CaseLabel = Class.create(Label, {
    initialize: function(x, y, id, currentCase) {
        if (id < 10) id = " ".concat(id)
        Label.call(this, id)
        this.x = x + CASE_LABEL_OFFSET_X;
        this.y = y + CASE_LABEL_OFFSET_Y;
        this.font = `${CASE_LABEL_FONT_SIZE} '${TEXT_FONT}'`;
        this.case = currentCase;
    },
    ontouchend: function() {
        this.case.ontouchend();
    }
})

// BUTTONS
const DealButton = Class.create(Sprite, {
    initialize: function(x, y, dealGame) { 
        Sprite.call(this, DEAL_BUTTON_WIDTH, DEAL_BUTTON_HEIGHT);
        this.image = game.assets[DEAL_BUTTON_IMAGE];
        this.x = x;
        this.y = y;
        this.dealGame = dealGame
    },

    ontouchend: function() {
        this.dealGame.takeDeal();
    }
})

const NoDealButton = Class.create(Sprite, {
    initialize: function(x, y, dealGame) { 
        Sprite.call(this, NO_DEAL_BUTTON_WIDTH, NO_DEAL_BUTTON_HEIGHT);
        this.image = game.assets[NO_DEAL_BUTTON_IMAGE];
        this.x = x;
        this.y = y;
        this.dealGame = dealGame;
    },

    ontouchend: function() {
        this.dealGame.noDeal();
    }
})

// LABELS
const CurrentChosenCaseLabel = Class.create(Label, {
    initialize: function(x, y) {
        Label.call(this, "")
        this.x = x;
        this.y = y;
        this.font = "48px 'Arial'";
    },
    change: function(caseValue) {
        this.text = "$".concat(numberWithCommas(caseValue));
        const padding = 10 - this.text.length
        for (let i = 0; i < padding; i++) {
            this.text = " ".concat(this.text);
        }
    },
    clear: function() {
        this.text = ""
    }
})

const NumberCasesToChooseLabel = Class.create(Label, {
    initialize: function(x, y) {
        Label.call(this, "PLEASE CHOOSE YOUR CASE")
        this.x = x;
        this.y = y;
        this.width = TOP_MESSAGE_WIDTH;
        this.font = `${TOP_MESSAGE_FONT_SIZE} '${TEXT_FONT}'`
    },
    change: function(casesToChoose) {
        this.x = TOP_MESSAGE_X_OFFSET;
        if (casesToChoose == 0) this.text = ""
        else if (casesToChoose == 1) this.text = this.text = "PLEASE CHOOSE ".concat(casesToChoose, " MORE CASE")
        else this.text = "PLEASE CHOOSE ".concat(casesToChoose, " MORE CASES")
    },
    displayMessage: function(message, fontSize) {
        this.x = TOP_MESSAGE_X - 30;
        if (!fontSize) fontSize = TOP_MESSAGE_FONT_SIZE
        this.font = `${fontSize} '${TEXT_FONT}'`
        this.text = message
    }
})

const EndGameMessage = Class.create(Label, {
    initialize: function(x, y, text) {
        Label.call(this, text)
        this.x = x;
        this.y = y;
        this.width = TOP_MESSAGE_WIDTH;
        this.font = `${TOP_MESSAGE_FONT_SIZE} '${TEXT_FONT}'`
    },
})

const BankOfferLabel = Class.create(Label, {
    initialize: function(x, y) {
        Label.call(this, "")
        this.x = x;
        this.y = y;
        this.font = "36px 'Arial'";
        this.color = BANK_OFFER_MESSAGE_COLOR;
    },
    change: function(text) {
        let centeredText = "$".concat(numberWithCommas(parseInt(text)))
        const padding = 8 - centeredText.length
        for (let i = 0; i < padding; i++) {
            centeredText = " ".concat(centeredText);
        }
        this.text = centeredText;
    },
    clear: function() {
        this.text = ""
    }
})

const GameRoundLabel = Class.create(Label, {
    initialize: function(x, y) {
        Label.call(this, "Round 1")
        this.x = x;
        this.y = y;
        this.round = 1;
        // game.rootScene.addChild(this);
    },
    increment: function() {
        this.text = "Round ".concat(++this.round)
    }
})

// MAIN
window.onload = function() {
    // INIT GAME
    game = new Game(GAME_SCREEN_WIDTH, GAME_SCREEN_HEIGHT);

    // LOAD SPRITES
    game.preload(CASE_IMAGE);
    game.preload(MAIN_GAME_BG_IMAGE);
    game.preload(WHITE_BG_IMAGE);
    game.preload(OPENED_CASE_BG_IMAGE);
    game.preload(OPENED_CASE_MODEL_SAD_BG_IMAGE);
    game.preload(BANKER_OFFER_BG_IMAGE);
    game.preload(DEAL_BUTTON_IMAGE);
    game.preload(NO_DEAL_BUTTON_IMAGE);
    game.preload(AMOUNT_CARD_IMAGE);
    game.preload(END_GAME_WIN_IMAGE);
    game.preload(END_GAME_LOSE_IMAGE);

    game.onload = function() {
        // populate cases on screen
        const dealGame = new DealOrNoDeal()
    }

    game.start();
}