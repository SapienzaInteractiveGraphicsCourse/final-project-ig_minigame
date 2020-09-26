"use strict"


var canvas;
var engine;
var scene;







//Global variable that is set when the "free debugging camera" is activated.
var isSceneFreezed = false;








//Boolean global variable stating whether the player has won the game or not
var winningCondition = false;


//The number of points for the winning condition.
var EASY_POINT_WINNING_CONDITION = 5;

var HARD_POINT_WINNING_CONDITION = 10;



//Set a respawn time for the tanks
var TANK_RESPAWN_TIME = 5000;





//These variables contain constant values that will be used to rule the loot box mechanism.

//How many machine gun bullets should be obtained from a single loot box.
var INCREASE_BULLETS_MACHINE_GUN_LOOTBOX = 10;

//How many points should be achieved by hitting a single point loot box
var INCREASE_POINTS_POINT_LOOTBOX = 1;

//How many cannon ball bullets should be obtained from a single loot box.
var INCREASE_BULLETS_CANNON_LOOTBOX = 2;

//How many life points should be obtained from a single health loot box.
var INCREASE_LIFE_POINTS_LOOTBOX = 3;





//The time after which a lootbox respawn.
var LOOT_BOX_RESPAWN_TIME = 5000;


//The size of the loot boxes.
var LOOT_BOX_SIZE = 12;




//Define the number of loot boxes when the game is in easy mode and in hard mode.
var NUM_LOOTBOXES_EASY = 9;
var NUM_LOOTBOXES_HARD = 6;



//Constant values that will map each of the different scenes in the game.
var MAIN_MENU_SCENE_VALUE = 0;
var FIRST_LEVEL_SCENE_VALUE = 1;
var DEATH_MENU_SCENE_VALUE = 2;




//Define the maximum number of opponent tanks
var MAX_NUM_TANK_EASY = 2;
var MAX_NUM_TANK_HARD = 4;



var managing_blueTanksArray = false;
var managing_redTanksArray = false;





//These global variables control buttons in the main menu
var daytime;
var soundEnabled = true;

var globalCloneTankId = 0;
var difficulty = 'easy';



var Game = {};
Game.scenes = [];

//First level.
Game.activeScene = MAIN_MENU_SCENE_VALUE;


//Set the rendering speed of the game
Game.renderingSpeed = 350;


document.addEventListener('DOMContentLoaded', startGame);



//moveWithCollision = move the mesh according to the collision engine.


function startGame() {
    canvas = document.getElementById('renderCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //Be aware of the fact that the canvas can be resized.




    //Attach an istance of the babylon js engine to the canvas.
    engine = new BABYLON.Engine(canvas, true);

    //Start the first level.
    startMenu();

}

var createMainMenu = function (engine) {
    return mainMenu(engine);
}




var createDeathMenu = function (engine) {
    return deathMenu(engine);
}

var startDeathMenu = function () {
    Game.scenes[Game.activeScene] = createDeathMenu(engine);


    var scene = Game.scenes[Game.activeScene];
    scene.assetsManager.load();
}


var startWinMenu = function(){

    Game.activeScene = DEATH_MENU_SCENE_VALUE;
    Game.scenes[Game.activeScene] = createDeathMenu(engine);


    var scene = Game.scenes[Game.activeScene];
    engine.runRenderLoop(function () {
        scene.render();
    })
}






var checkWinCondition = function(scene){
      //Move completely to another scene.

      if(scene != Game.scenes[Game.activeScene]) return;

    
      if(!scene.heroTank) return;
      var heroTank = scene.heroTank;

    
      var pointWinningCondition;
      if(difficulty == 'easy')
        pointWinningCondition = EASY_POINT_WINNING_CONDITION;
      else if(difficulty == 'hard')
        pointWinningCondition = HARD_POINT_WINNING_CONDITION;





      if(heroTank.tankStatus.points >= pointWinningCondition){
       
        engine.stopRenderLoop();

        var scene = Game.scenes[Game.activeScene];

        Game.activeScene = DEATH_MENU_SCENE_VALUE;

        scene.dispose();


        //Set the win condition = true to display the win menu.
        winningCondition = true;



        //Render the death menu
        startWinMenu();
      }
      return;
}




var startMenu = function () {
    Game.activeScene = MAIN_MENU_SCENE_VALUE;
    Game.scenes[Game.activeScene] = createMainMenu(engine);


    var scene = Game.scenes[Game.activeScene];



    //Start the assetsManager to load the tanks
    scene.assetsManager.load();

}










var startFirstScene = function () {




    Game.activeScene = FIRST_LEVEL_SCENE_VALUE;

    //Creat the first level in this very simple manner.
    Game.scenes[Game.activeScene] = createFirstScenario();

    var scene = Game.scenes[Game.activeScene];
    modifySettings(scene);

    var heroTank = scene.heroTank;



    //var tank = scene.getMeshByName("boxTank0");
    //var portal = createPortal(scene,tank);


    scene.collisionsEnabled = true;


    scene.toRender = function () {

        //Slow down the game
        setTimeout(function(){
            //Enable tank movement when rendering the scene.
            var heroTank = scene.heroTank;
            
            //If the scene is freezed for debugging purposes, the tanks must not move.
            if(!isSceneFreezed){
                startTank(scene, heroTank);


                //Start the other teams tanks.
                startBlueTeamTanks(scene);

                registerLootBoxTriggers(scene);

                registerOutsideOfMapTrigger(scene);

                //Check whether the player has won the game or not
                checkWinCondition(scene);
            }

        },Game.renderingSpeed);

        updateInGameGUI(scene);



      
        scene.render();

    }

    scene.assetsManager.load();
}





var updateInGameGUI = function(scene){

    //Some sanity checks
    if(!scene.pointText || !scene.healthText || !scene.machineGunText || !scene.cannonText) return;


    var pointText = scene.pointText;
    var healthText = scene.healthText;
    var machineGunText = scene.machineGunText;
    var cannonText = scene.cannonText;


    if(!scene.heroTank) return;

    var heroTank = scene.heroTank; 

    var tankStatus = heroTank.tankStatus;

    pointText.text = "Points: ".concat(tankStatus.points.toString());
    healthText.text = "Health: ".concat(tankStatus.health.toString());  
    machineGunText.text = "Machine gun bullets: ".concat(tankStatus.machineGunBullets.toString());  
    cannonText.text = "Cannon bullets: ".concat(tankStatus.cannonBullets.toString());
    

    return;
}




/**
 * This function creates an advanced texture that displays the status of the hero tank.
 * @param {BABYLON.Scene} scene an object representing the scene.
 * @todo Change the style of the text in the text blocks.
 */
var createInGameGUI = function(scene){


    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("In game UI");
   
    var panel = new BABYLON.GUI.StackPanel();


    //Define the title container and some properties.
    var healthText = new BABYLON.GUI.TextBlock();
    healthText.text = "Health: ".concat("0");
    healthText.height = "30px";
    healthText.color = "pink";

    //Define the title container and some properties.
    var machineGunText = new BABYLON.GUI.TextBlock();
    machineGunText.text = "Machine gun bullets: ".concat("0");
    machineGunText.height = "30px";
    machineGunText.color = "green";
    


    //Define the title container and some properties.
    var cannonText = new BABYLON.GUI.TextBlock();
    cannonText.text = "Cannon bullets: ".concat("0");
    cannonText.height = "30px";
    cannonText.color = "orange";
    


    //Define the title container and some properties.
    var pointText = new BABYLON.GUI.TextBlock();
    pointText.text = "Points: ".concat("0");
    pointText.height = "30px";
    pointText.color = "yellow";

    cannonText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	cannonText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    machineGunText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	machineGunText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    pointText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	pointText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    
    healthText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
	healthText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    //Add all the text block to the displayed panel.
    panel.addControl(healthText);
    panel.addControl(machineGunText);
    panel.addControl(cannonText);
    panel.addControl(pointText);

    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;


    //Add the panel to the advanced texture.
    advancedTexture.addControl(panel);

    //Add to the scene each and every control panels so that we can readily access them throught the advancedTexture object.
    scene.pointText = pointText;
    scene.machineGunText = machineGunText;
    scene.cannonText = cannonText;
    scene.healthText = healthText;





    return;
    

}





var createFirstScenario = function () {




    scene = new BABYLON.Scene(engine);
    scene.enablePhysics();

   

    //Create a set of textblocks using BABYLON GUI to display information of the game status.
    createInGameGUI(scene);



    scene.assetsManager = configureAssetsManager(scene);



    //Enable the keyboard events for the scene.
    enableKeyEventListeners();


    //Enable the mouse click events.
    enableClickEventListeners(scene);

    var groundOptions = {
        'height': 2000,
        'width': 2000,
        'subdivisions': 50,
        'updatable': false
    };

    var groundTextureUrl = "texture/groundGrid.jpg";

    var ground = createGround(scene, groundOptions, groundTextureUrl, true);
    scene.ground = ground;




    //Array of objects represeting light properties, positions, colours etc..
    var lights = [
        {
            'name': 'dir0',
            'type': 'directional',
            'position': new BABYLON.Vector3(-1, -1, 0),
            'diffuseColor': new BABYLON.Color3.White
        },
    ];

    //scene.ambientColor = new BABYLON.Color3(0.3,0.76,0.3);




    //Create lights
    createLights(scene, lights);


    var freeCameraInitPos = new BABYLON.Vector3(0, 30, 0);
    var cameraName = "debugCamera";
    var camera = createDebugCamera(scene, freeCameraInitPos, cameraName);
    if (camera) {
        scene.debugCamera = camera;
    }
    else {
        alert("Error in creating the free debug camera with name");
    }


    var model_root_dir = 'models/tanks/basicTank/';
    var babylon_file_name = 'tank.babylon';



    /**Here we define the code to import the HeroTank. The heroTank is actually a set of meshes
     * that must be put inside a hierarchical model.
     * */
    var model_names = ["Box", "Box1", "Box3", "Box4", "Box5", "Box6", "Box7", "Box9", "Box10", "Box11", "Box12", "Box13", "Box14", "Box15"];

    //Those positions are just for rendering the object.
    var importedModelPosition = {
        'x': 10,
        'y': 0,
        'z': 10
    };

    var modelType = 'tank';




    //Import the model of the first tank.
    importModel(model_names, model_root_dir, babylon_file_name, scene, importedModelPosition, modelType);



    //Once the model is imported we enable the "interactive" aspect by enabling the tank-environment interactions
    enableTankAction();


    //Display main menu.
    mainMenu();

    //Create the loot boxes
    createLootBoxes(scene);




    return scene;



};





window.addEventListener('resize', function () {
  
 
    //Executing these lines will make the canvas to cover 100% of the screen.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (engine)
        engine.resize();


});   
