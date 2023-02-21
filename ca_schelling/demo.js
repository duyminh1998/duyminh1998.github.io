;
jQuery(function($){    
    'use strict';

    var App = {
        // Global variables
        n: 25, // the dimensions of the board
        tolerance: 0.7, // each cell's tolerance for their neighbors
        initialRatio: 0.5, // initial percentage of cells of one kind to the other
        emptyPerc: 0.1, // the percentage of empty cells
        delay: 100, // the delay between each step for the animation (ms)
        neighborhoodType: 'moore', // the type of neighborhoods, ['moore', 'neumann']
        boundaryCond: 'cut-off', // the boundary conditions, ['cut-off', 'periodic']
        cellClasses: ["cell blank", "cell zero", "cell one"], // strings that identify the colors of the cells

        init: function () {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            // App.resetBits("#input-bits-");

            // Event bindings
            // Reset the board
            App.$doc.on('click', '#reset-board-btn', function() {
                App.resetBoard('#pos', 2500, 0, 0);              
            });            
        },

        resetBoard: function(src, nCells, ratio, emptyPerc) {
            /*
            Description:
                Resets the CA board with a new configuration.

            Arguments:
                src: the common ID of the cells. To be concatenated with numbers to find the cells.
                nCells: the number of cells on the board.
                ratio: the ratio of zero to one cells.
                emptyPerc: the percentage of empty cells.

            Return:
                (None)
            */
            for (let i = 0; i < nCells; i++) {
                $(src.concat(i)).attr('class', App.cellClasses[Math.floor(Math.random() * App.cellClasses.length)]);
            }
        }               
    };

    App.init();

}($));