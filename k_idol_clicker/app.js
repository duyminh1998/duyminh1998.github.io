enchant();
window.onload = function(){
    var game = new Game(320, 320); 

    var label = new Label('Hello, enchant.js!');
    label.x = 50
    label.y = 100
    game.rootScene.addChild(label);

    game.start();
}