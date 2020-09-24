
"use strict"

/**
 * This file handle the menu generation. We will use the BABYLON advanced texture.
*/



/**
 * This functions build the scene that renders the main menu of the "Minigame". The main menu
 * of the minigame is a minimal design intruductive scene. It must display the title of the game,
 * an interactive button that starts the game (force the engine to load another scene), button
 * to switch from day to night time and a button to increase the difficulty of the game.
 * Each component of the GUI is rendered using BABYLON js AdvancedDynamicTexture class 
 * (see babylon.gui.js).
 * 
 * This function is inspired from the playoground Taken from the documentation: https://www.babylonjs-playground.com/#XCPP9Y#121 
 * @param {BABYLON.Engine} engine the object representing the BABYLON js engine.
 * @todo Add an image to the background of the scene.
 * @todo Add another difficulty level to the game.
*/
var mainMenu = function (engine) {

    // This creates a basic Babylon Scene object (non-mesh).
    var scene = new BABYLON.Scene(engine);
   
    // light1
	var light = new BABYLON.HemisphericLight("dir01", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.5;
    light.groundColor = new BABYLON.Color3(2, 2, 2);
    
    // This creates and positions a free camera (non-mesh).
    var camera = new BABYLON.FreeCamera("cameraMainMenu", new BABYLON.Vector3(0, 7, -10), scene);
    camera.rotation.z += 30;


    // This targets the camera to scene origin
    camera.setTarget(new BABYLON.Vector3(0,7,10));
    camera.position = new BABYLON.Vector3(0,7,7);

    var ground = BABYLON.Mesh.CreateGround("groundMenu", 100, 100, 1, scene);
	var groundMaterial = new BABYLON.StandardMaterial("groundMenuMaterial", scene);
	groundMaterial.diffuseTexture = new BABYLON.Texture("texture/groundGrid.jpg", scene);
    //groundMaterial.diffuseTexture.level = .25;
	//groundMaterial.diffuseTexture.uScale = 6;
	//groundMaterial.diffuseTexture.vScale = 6;
	groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	ground.material = groundMaterial;


    //Set the background color to black. You can actually use an image as background.
    scene.clearColor = new BABYLON.Color3.Black;


    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("Menu UI");

    var panelTitle = new BABYLON.GUI.StackPanel();


    //Define the title container and some properties.
    var title = new BABYLON.GUI.TextBlock();
    title.text = "Interactive Graphics MiniGame";
    title.height = "30px";
    title.color = "white";

    title.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_TOP;
    title.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;


    //The title is a child of the panel (that contains the GUI object).
    panelTitle.addControl(title);

    advancedTexture.addControl(panel);

    panelTitle.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_TOP;
    panelTitle.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

    advancedTexture.addControl(panelTitle);


    var panel = new BABYLON.GUI.StackPanel();


    //Add an interactive button to start the game and define some parameters.
    var buttonStartGame = BABYLON.GUI.Button.CreateSimpleButton("buttonStartGame", "Start Game");
    buttonStartGame.width = 0.2;
    buttonStartGame.height = "90px";
    buttonStartGame.paddingBottom = "40px";
    buttonStartGame.color = "white";
    buttonStartGame.background = "green";


    //This listener will be triggered when the button is clicked (actually when the mouse "unpick" the object).
    buttonStartGame.onPointerDownObservable.add(function () {


        //Stop the render loop of the engine. We need to move to another scene.
        engine.stopRenderLoop();

        //Retrieve the scene from the global Game array.
        var scene = Game.scenes[Game.activeScene];



        //Destroy the scene, for efficiency and RAM reasons.
        scene.dispose();


        //Set the interactive level as active scene.
        Game.activeScene = FIRST_LEVEL_SCENE_VALUE;

        startFirstScene();


    });


    panel.addControl(buttonStartGame);


    //Add an interactive button to switch to disable sound and define some parameters.
    var buttonSound = BABYLON.GUI.Button.CreateSimpleButton("buttonSound", "Disable sound");
    buttonSound.width = 0.2;
    buttonSound.height = "40px";
    buttonSound.color = "white";
    buttonSound.background = "green";

    buttonSound.height = "90px";
    buttonSound.paddingBottom = "40px";



    //This listener will be triggered when the button is clicked (actually when the mouse "unpick" the object).
    buttonSound.onPointerUpObservable.add(function () {

        //Set time to nightTime
        if (soundEnabled) {

            soundEnabled = false;

            buttonSound.textBlock.text = 'Disable sound';


        }
        else {

            buttonSound.textBlock.text = 'Enable sound';
            soundEnabled = true;



        }
    });



    panel.addControl(buttonSound);






    //Add an interactive slider to switch the game difficulty.
    var slider = new BABYLON.GUI.Slider();
    slider.minimum = 1;
    slider.maximum = 2;
    slider.value = 1;

    slider.step = 1;
    slider.height = "20px";
    slider.width = "200px";
    slider.background = 'blue';



    panel.addControl(slider);



    var header = new BABYLON.GUI.TextBlock();
    header.text = "Difficulty: easy";
    header.height = "30px";
    header.color = "white";
    panel.addControl(header);


    /**
     * The game has actually two possible difficulties: 'easy', 'hard'. 
    */
    slider.onValueChangedObservable.add(function (value) {
        if (value == 1) {
            header.text = 'Difficulty: easy';
            difficulty = 'easy';
        }
        else if (value == 2) {
            header.text = 'Difficulty: hard';
            difficulty = 'hard';
        }

    });




    advancedTexture.addControl(panel);

    return scene;

}



/**
 * This function will create the death menu scene. The design is minimal. This menu
 * has the only purpose of bringing the player back to the main menu. The background
 * is just a black screen and we need just to render a simple message and a button that
 * leads the player to the main menu. 
 * 
 * Each component of the GUI is rendered using BABYLON js AdvancedDynamicTexture class 
 * (see babylon.gui.js).
 * 
 * This function is inspired from the playoground Taken from the documentation: https://www.babylonjs-playground.com/#XCPP9Y#121
 * @param {BABYLON.Engine} engine the object representing the scene.
*/
var deathMenu = function (engine) {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("cameraDeath", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    scene.clearColor = new BABYLON.Color3.Black;


    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("Death UI");

    var panel = new BABYLON.GUI.StackPanel();

    var title = new BABYLON.GUI.TextBlock();

    if (!winningCondition)
        title.text = "YOU DIED!";
    else
        title.text = "YOU WIN";
    title.height = "60px";
    title.color = "white";


    panel.addControl(title);


    //Add an interactive button to get back to the main menu and define some parameters.
    var buttonStartGame = BABYLON.GUI.Button.CreateSimpleButton("buttonDeathScreen", "Main menu");
    buttonStartGame.width = 0.2;
    buttonStartGame.height = "90px";

    buttonStartGame.paddingBottom = "40px";

    buttonStartGame.color = "white";
    buttonStartGame.background = "green";

    //This listener will be triggered when the button is clicked (actually when the mouse "unpick" the object).
    buttonStartGame.onPointerDownObservable.add(function () {


        //Stop the render loop of the engine.
        engine.stopRenderLoop();

        //Retrieve the scene from the global Game array.
        var scene = Game.scenes[Game.activeScene];



        //Destroy the scene, for efficiency and RAM reasons.
        scene.dispose();


        //The scene number 0 is the main menu.
        Game.activeScene = MAIN_MENU_SCENE_VALUE;


        //We will actually render the main menu.
        startMenu();




    });


    panel.addControl(buttonStartGame);

    return scene;

}

