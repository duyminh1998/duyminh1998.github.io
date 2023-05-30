;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        n: 50, // the dimensions of the board
        populations: 2, // the number of populations
        tolerance: 0.7, // each cell's tolerance for their neighbors
        initialRatio: 0.5, // initial percentage of cells of one kind to the other
        initialRatios: [33, 33, 34], // a list to hold initial percentage of cells for simulations with more than two populations
        emptyPerc: 0.1, // the percentage of empty cells
        delay: 100, // the delay between each step for the animation (ms)
        neighborhoodType: 'moore', // the type of neighborhoods, ['moore', 'neumann']
        boundaryCond: 'cut-off', // the boundary conditions, ['cut-off', 'periodic']
        cellClasses: ["cell white", "cell homeblue", "cell brightpurple", "cell orange", "cell yellow", "cell blue", "cell red", "cell green", "cell lime", "cell brown", "cell peach"], // strings that identify the colors of the cells
        availableColors: ["cell white", "cell blue", "cell red", "cell aquamarine", "cell magenta", "cell yellow", "cell orange", "cell brightpurple", "cell homepurple", "cell homeblue", "cell blank", "cell black", "cell green", "cell lime", "cell brown", "cell maroon", "cell skyblue", "cell peach"], // all the possible colors
        paused: true, // whether or not the simulation is paused
        maxGenNoChange: 1, // the maximum number of generations to check for no change
        countGenNoChange: 0, // the current number of generations where no agents moved

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            App.initBoard();
            App.setBoardInHTML();
            App.observe('#pos');

            // Event bindings
            // Range input sliders
            App.$doc.on('input', '#tolerance-range', function() {
                App.tolerance = document.getElementById('tolerance-range').value / 100;
                $("#similarity-intext").text(document.getElementById('tolerance-range').value.toString());
            });            
            App.$doc.on('input', '#initial-ratio-range', function() {
                App.initialRatio = document.getElementById('initial-ratio-range').value / 100;
                $("#initial-ratio-intext").text(document.getElementById('initial-ratio-range').value.toString());
                App.initBoard();
                App.observe('#pos');
            });
            App.$doc.on('input', '#empty-range', function() {
                App.emptyPerc = document.getElementById('empty-range').value / 100;
                $("#empty-intext").text(document.getElementById('empty-range').value.toString());
                App.initBoard();
                App.observe('#pos');
            });
            App.$doc.on('input', '#delay-range', function() {
                App.delay = document.getElementById('delay-range').value;
                $("#delay-intext").text(App.delay.toString());
            });  
            App.$doc.on('input', '#board-size-range', function() {
                App.n = document.getElementById('board-size-range').value;
                $("#board-size-intext").text(App.n.toString().concat('x', App.n));
                App.initBoard();
                App.setBoardInHTML();
                App.observe('#pos');
            });
            App.$doc.on('input', '.initial-ratio-range-slider', function() {
                let sliderID = $(this).attr('id');
                let sliderIdx = sliderID.charAt(sliderID.length - 1);
                let sliderVal = document.getElementById(sliderID).value.toString();
                $("#pop-initial-ratio-intext-".concat(sliderIdx)).text(sliderVal);
                App.initialRatios[sliderIdx - 1] = sliderVal;
                // update initial ratio sliders max range
                for (let i = 1; i <= App.populations; i++) {
                    let newMax = 100;
                    for (let j = 0; j < App.initialRatios.length; j++) {
                    if (j + 1 != i) newMax = newMax - App.initialRatios[j];
                    }
                    $("#pop-max-ratio-intext-".concat(i)).text(newMax);
                    $("#pop-initial-ratio-range-".concat(i)).attr({max: newMax});
                }
                App.initBoard();
                App.observe('#pos');
            });

            // Buttons                
            // Reset the board
            App.$doc.on('click', '#reset-board-btn', function() {      
            		App.setInitialPopulationControlsInHTML();
                App.initBoard();
                App.observe('#pos');
            });
            // Start the simulation
            App.$doc.on('click', '#start-btn', function() {
                App.paused = false;
                App.startSimulation();
            });
            // Stop the simulation
            App.$doc.on('click', '#stop-btn', function() {
                App.stopSimulation();
            });
            // Step the simulation forwards one step
            App.$doc.on('click', '#step-btn', function() {
                App.updateConfig();
                App.observe('#pos');
            });
            // Pick random colors for the cells
            App.$doc.on('click', '#random-colors-btn', function() {
                App.randomizeCellColors();
                App.observe('#pos');
            });

            // Drop-downs
            $("#populations-cnt").on("change", function() {
                let selectedVal = this.value;
                App.populations = parseInt(selectedVal);
                App.setInitialPopulationControlsInHTML();
                App.initBoard();
                App.observe('#pos');
            });            
            $("#neighborhood-type").on("change", function() {
                let selectedVal = this.value;
                App.neighborhoodType = selectedVal;
            });      
            $("#boundary-cond").on("change", function() {
                let selectedVal = this.value;
                App.boundaryCond = selectedVal;
            });
            App.setColorSelectionCallback();
            $("#blank-cells-color").on("change", function() {
                let selectedVal = this.value;
                // console.log(selectedText);
                // console.log(selectedVal);
                App.updateColor(0, selectedVal);
                App.observe('#pos');
            });                        
        },
        // Methods
        randomlySetBoard: function(src) {
            /*
            Description:
                Resets the CA board with a new configuration.

            Arguments:
                src: the common ID of the cells. To be concatenated with numbers to find the cells.

            Return:
                (None)
            */
            for (let i = 0; i < (App.n * App.n); i++) {
                $(src.concat(i)).attr('class', App.cellClasses[Math.floor(Math.random() * App.cellClasses.length)]);
            }
        },
        setColorSelectionCallback: function() {
            /*
            Description:
                Set up a function to change the cells' colors in the event of a color dropdown change (in case the function gets deleted.)

            Arguments:
                None

            Return:
                (None)
            */            
            $(".pop-color-sel").on("change", function() {
                let selID = $(this).attr('id');
                let selIdx = selID.charAt(selID.length - 1);
                let selectedVal = document.getElementById(selID).value.toString();
                App.updateColor(selIdx, selectedVal);
                App.observe('#pos');
            });
        },
        randomizeCellColors: function() {
            /*
            Description:
                Randomly sets the colors of the populations.

            Arguments:
                None

            Return:
                (None)
            */
            let randomColors = App.getRandomSubarray(App.availableColors, App.populations + 1);
            for (let i = 0; i < randomColors.length - 1; i++) {
                App.cellClasses[i + 1] = randomColors[i];
                $('#pop-color-'.concat(i + 1)).val(App.cellClasses[i + 1].substring(5));
            }
            // Blank cell
            App.cellClasses[0] = randomColors[randomColors.length - 1];
            $('#blank-cells-color').val(App.cellClasses[0].substring(5));           
        },
        setInitialPopulationControlsInHTML: function() {
            /*
            Description:
                Set up the initial population controls in HTML depending on the number of populations.

            Arguments:
                None

            Return:
                (None)
            */
            // Clear the initial ratio controls div
            $('#initial-ratio-controls').empty();
            $('#pop-color-controls').empty();
            if (App.populations == 2) {
            	$('#initial-ratio-controls').html($("#initial-ratio-controls-2-pop-template").html());
                $('#pop-color-controls').html($('#2-pop-color-choices-template').html());
                for (let i = 0; i < App.populations; i++) {
                    $('#pop-color-'.concat(i + 1)).val(App.cellClasses[i + 1].substring(5));
                }
            }
            else {
            	let equalDistribution = Math.floor(100 / App.populations);
            	for (let i = 1; i <= App.populations; i++) {
                    if (i == App.populations) equalDistribution = 100 - ((App.populations - 1) * equalDistribution);
                    $('#initial-ratio-controls').append('<div class="slider-container"><a>Pop '.concat(i, ' ratio (<a id="pop-initial-ratio-intext-', i, '">', equalDistribution, '</a>% out of&nbsp<a id="pop-max-ratio-intext-', i, '">', equalDistribution, '</a>%)</a><input type="range" min="0" max="', equalDistribution, '" value="', equalDistribution, '" class="initial-ratio-range-slider" id="pop-initial-ratio-range-', i, '"></div>'));
                    App.initialRatios[i - 1] = equalDistribution;
                    
                    // add new population color control
                    $('#pop-color-controls').append('<div class="dropdown-container" id="color-dropdown-container-'.concat(i, '"><label for="pop-color-', i, '">Population ', i, ' color: </label><select class="pop-color-sel" name="pop-color-', i, '" id="pop-color-', i, '"></select></div>'));
                    $('#pop-color-'.concat(i)).html($("#pop-color-choices-template").html());
                    // $('#pop-color-'.concat(i)).prop('selectedIndex', i);
                    $('#pop-color-'.concat(i)).val(App.cellClasses[i].substring(5));
                }
            }
            App.setColorSelectionCallback();
        },
        setBoardInHTML: function() {
            /*
            Description:
                Resets the CA board in HTML.

            Arguments:
                None

            Return:
                (None)
            */
            // Clear the html board
            $('#config-table').empty();
            let i = 0;
            // add td elements
            for (let x = 0; x < App.n; x++) {
                // add a row
                $('#config-table').append("<tr id='tr".concat(x, "'></tr>"));
                for (let y = 0; y < App.n; y++) {
                    $('#tr'.concat(x)).append("<td id='pos".concat(i, "'></td>"));
                    i++;
                }
            }
        },
        initBoard: function() {
            /*
            Description:
                Initializes the CA board with a new configuration.

            Arguments:
                None

            Return:
                (None)
            */
            // pause the simulation if it is already running
            if (!App.paused) {
                App.paused = true;
            }
            // CA configurations
            let config = App.createArray(App.n, App.n);
            // fill initial config with ones
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    config[x][y] = 0;
                }
            }
            // let nextconfig = App.createArray(App.n, App.n);
            // sample indices for the empty spaces and each population
            let og_idx = [];
            for (let i = 0; i < App.n * App.n; i++) {
                og_idx.push(i);
            }
            let emptyIdx = [];
            if (App.emptyPerc > 0.0) {
                emptyIdx = App.getRandomSubarray(og_idx, parseInt(Math.floor(App.emptyPerc * App.n * App.n)));
                // remove the indices of the empty spaces from the original index list
                og_idx = og_idx.filter(x => !emptyIdx.includes(x));
            }
            // empty spaces
            if (App.emptyPerc > 0.0 && emptyIdx.length > 0) {
                emptyIdx.forEach(function(e_idx) {
                    config[Math.floor(e_idx / App.n)][e_idx % App.n] = -1
                });
            }            
            // assign levels for the empty spaces and the two populations: -1 = empty space, 0 = first population, 1 = second population
            if (App.populations == 2) {
              // first population
              let first_pop_idx = App.getRandomSubarray(og_idx, parseInt(Math.floor(App.initialRatio * og_idx.length)));
              first_pop_idx.forEach(function(fp_idx) {
                  config[Math.floor(fp_idx / App.n)][fp_idx % App.n] = 1
              });
            } else {
            	let agentCap = og_idx.length;
            	for (let i = 1; i < App.populations; i++) {
              	let ith_pop_idx = App.getRandomSubarray(og_idx, parseInt(Math.floor((App.initialRatios[i] / 100) * agentCap)));
                ith_pop_idx.forEach(function(ip_idx) {
                	config[Math.floor(ip_idx / App.n)][ip_idx % App.n] = i
                });
                // remove the indices of the empty spaces from the original index list   
                og_idx = og_idx.filter(x => !ith_pop_idx.includes(x));   
              }
              // if the populations do not add up to 100, allocate some empty spaces
              let ratioSum = 100;
              App.initialRatios.forEach(ratio => {
              	ratioSum -= ratio;
              })
              if (ratioSum != 0) {
              		emptyIdx = App.getRandomSubarray(og_idx, parseInt(Math.floor((ratioSum / 100) * agentCap)));
                  emptyIdx.forEach(function(e_idx) {
                    config[Math.floor(e_idx / App.n)][e_idx % App.n] = -1
                	});
              }
            }
            // save a list of empty spaces and agents for future re-allocation
            App.emptySpaces = [];
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    if (config[x][y] == -1) {
                        App.emptySpaces.push([x, y]);
                    }
                }
            }
            // save the configuration
            App.config = config;
            // App.nextconfig = structuredClone(App.config);
            App.step = 0;
            App.countGenNoChange = 0;
            App.totalSatisfied = App.sumSatisfaction();
            App.totalAgents = App.n * App.n - (parseInt(Math.floor(App.emptyPerc * App.n * App.n)));
            // update the blog page's text
            $("#generation-intext").text(App.step);
            $("#percent-satisfied-intext").text(((App.totalSatisfied / App.totalAgents) * 100).toFixed(2));            
        },
        observe: function(src = '#pos') {
            /*
            Description:
                Use config to put color on the board in the HTML document.
                
            Arguments:
                src: the common ID of the cells. To be concatenated with numbers to find the cells.
                
            Return:
                (None)
            */
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    let currentAgent = App.config[x][y];
                    let i = x + App.n * y;
                    $(src.concat(i)).attr('class', App.cellClasses[currentAgent + 1]);
                }
            }
        },
        updateColor: function(population, color) {
            /*
            Description:
                Use config to put color on the board in the HTML document.
                
            Arguments:
                population: the index to the population that we want to update the color for.
                color: the color value to set.
                
            Return:
                (None)
            */
           let newColor = 'cell '.concat(color);
           App.cellClasses[population] = newColor;
        },        
        createArray: function(length) {
            // https://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript/966938#966938
            let arr = new Array(length || 0),
                i = length;

            if (arguments.length > 1) {
                let args = Array.prototype.slice.call(arguments, 1);
                while (i--) arr[length - 1 - i] = App.createArray.apply(this, args);
            }

            return arr;
        },
        getRandomSubarray: function(arr, size) {
            // https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
            let shuffled = arr.slice(0),
                i = arr.length,
                min = i - size,
                temp, index;
            while (i-- > min) {
                index = Math.floor((i + 1) * Math.random());
                temp = shuffled[index];
                shuffled[index] = shuffled[i];
                shuffled[i] = temp;
            }
            return shuffled.slice(min);
        },
        getNeighbors: function(x, y, neighborhoodType, boundaryCond) {
            /*
            Description:
                Return the neighbors of a point at (x, y) according to the neighborhood type and boundary conditions
            
            Arguments:
                x: the x-coordinate of the individual.
                y: the y-coordinate of the individual.      
                n_type: the type of neighborhood. Currently supports 'moore' and 'neumann'.
                boundary_cond: the boundary conditions. Currenty supports 'cut-off' and 'periodic'.
            
            Return:
                (list) a list of coordinate tuples of the neighbors
            */
            let neighbors = [];
            let delta = [];
            if (neighborhoodType == 'moore') {
                delta = [
                    [0, 1],
                    [1, 0],
                    [1, 1],
                    [0, -1],
                    [-1, 0],
                    [-1, -1],
                    [1, -1],
                    [-1, 1]
                ];
            } else if (neighborhoodType == 'neumann') {
                delta = [
                    [0, 1],
                    [1, 0],
                    [0, -1],
                    [-1, 0]
                ];
            }
            delta.forEach(function(offsetCoord) {
                let dx = offsetCoord[0];
                let dy = offsetCoord[1];
                let neighbor = null;
                if (boundaryCond == 'periodic') {
                    let new_x = null;
                    let new_y = null;
                    if (x + dx < 0) {
                        new_x = App.n - 1;
                    } else {
                        new_x = (x + dx) % App.n;
                    }
                    if (y + dy < 0) {
                        new_y = App.n - 1;
                    } else {
                        new_y = (y + dy) % App.n;
                    }
                    neighbor = [new_x, new_y];
                } else if (boundaryCond == 'cut-off') {
                    if (!(x + dx >= App.n || x + dx < 0 || y + dy >= App.n || y + dy < 0)) {
                        neighbor = [x + dx, y + dy];
                    }
                }
                if (neighbor) {
                    neighbors.push(neighbor);
                }
            });
            return neighbors;
        },
        determineSatisfaction: function(x, y) {
            /*
            Description:
                    Determines whether the individual at coordinates (x, y) is satisfied by looking at their neighbors in a Moore neighborhood with periodic boundary conditions.
            
            Arguments:
                x: the x-coordinate of the individual.
                y: the y-coordinate of the individual.
            
            Return:
                (int) 0 for dissatisfied and 1 for satisfied
            */
            let neighbors = App.getNeighbors(x, y, App.neighborhoodType, App.boundaryCond);
            let currentAgent = App.config[x][y];
            let countSimilar = 0;
            let totalN = 0;
            // determine whether we have enough neighbors of the same population
            neighbors.forEach(function(neighborCoord) {
                let neighborX = neighborCoord[0];
                let neighborY = neighborCoord[1];
                // console.log(neighborCoord);
                let neighbor = App.config[neighborX][neighborY];
                if (neighbor != -1 && neighbor == currentAgent) {
                    countSimilar += 1;
                }
                if (neighbor != -1) {
                    totalN += 1;
                }
            });
            // if the agent is isolated without any neighbors
            if (totalN == 0) {
                return 1; // satisfied
            }
            if (countSimilar / totalN >= App.tolerance) {
                return 1; // satisfied
            }
            return 0 // dissatisfied
        },
        sumSatisfaction: function() {
            /*
            Description:
                Get the satisfaction of the entire configuration.
            Arguments:
                None
            Return:
                (float) the ratio of satisfied agents
            */
            let totalSatisfaction = 0;
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    if (App.config[x][y] != -1) { // if we have an agent
                        totalSatisfaction += App.determineSatisfaction(x, y);
                    }
                }
            }
            return totalSatisfaction;
        },
        agentReallocation: function(x, y) {
            /*
            Description:
                Re-allocate the individual at coordinate (x, y) to a random empty space.
            
            Arguments:
                x: the x-coordinate of the individual.
                y: the y-coordinate of the individual.
            
            Return:
                (tuple) the location of the new individual or None if there are no empty spaces left
            */
            if (App.emptySpaces.length == 0) { // cannot move if there are no empty spaces
                return null;
            }
            // randomly sample an empty space and remove that space from the running list of empty spaces
            let randomEmptySpaceIdx = Math.floor(Math.random() * App.emptySpaces.length);
            let newHome = App.emptySpaces[randomEmptySpaceIdx];
            App.emptySpaces.splice(randomEmptySpaceIdx, 1); // remove empty space from list of empty space
            App.emptySpaces.push([x, y]); // add the individual's past location into the list of empty spaces
            return newHome;
        },
        updateConfig: function() {
            /*
            Description:
                Loop through the current configuration and randomly choose an agent to check for satisfaction.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            // App.nextconfig = App.copy2DArr(App.config);
            // App.nextconfig = JSON.parse(JSON.stringify(App.config))
            App.nextconfig = structuredClone(App.config);
            App.totalSatisfied = 0;
            let moved = false; // if no agents moved, stop the simulation
            // loop through the agents and look for all dissatisfied agents
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    if (App.config[x][y] != -1) { // we have an agent and not an empty square
                        let satisfaction = App.determineSatisfaction(x, y);
                        if (satisfaction == 0) { // re-allocate agent if not satisfied
                            let newHome = App.agentReallocation(x, y);
                            if (newHome) {
                                let newHomeX = newHome[0];
                                let newHomeY = newHome[1];
                                App.nextconfig[newHomeX][newHomeY] = App.config[x][y];
                                App.nextconfig[x][y] = -1 // make the agent's old location empty
                                if (!moved) {
                                    moved = true;
                                }
                            }
                        } else { // agent is satisfied
                            App.totalSatisfied = App.totalSatisfied + 1;
                        }
                    }
                }
            }
            // should implement a truly random loop by getting a random shuffling of the indices of the cells

            // step the config forward
            App.config = App.nextconfig;
            App.step = App.step + 1;
            // if we did not move any agents, stop the simulation
            if (!moved) {
                App.countGenNoChange = App.countGenNoChange + 1;
            }
            if (App.countGenNoChange > App.maxGenNoChange) {
                App.paused = true;
                // console.log("Done")
            }
            // update the blog page's text
            $("#generation-intext").text(App.step);
            $("#percent-satisfied-intext").text(((App.totalSatisfied / App.totalAgents) * 100).toFixed(2));   
        },
        copy2DArr: function(arr1) {
            let arr2 = App.createArray(App.n, App.n);
            for (let x = 0; x < arr1.length; x++) {
                for (let y = 0; y < arr1[x].length; y++) {
                    arr2[x][y] = arr1[x][y];
                }
            }
            return arr2;
        },
        startSimulation: async function() {
            /*
            Description:
                Starts the simulation and run until there is no change in satisfaction.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            while (!App.paused) {
                await App.sleep(App.delay);
                App.updateConfig();
                App.observe('#pos')
            }
        },
        stopSimulation: function() {
            /*
            Description:
                Stops the simulation.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            App.paused = true;
        },
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        mod: function(n, m) {
            // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
            return ((n % m) + m) % m;
        }
    };

    App.init();

}($));