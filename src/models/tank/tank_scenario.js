"use strict"


/**
 * This file contains the definition of many helper functions that are used by the BABYLON.Scene
 * object to handle the tanks.
 */







/**
 * Callback function that is called when the tank model contained in the .babylon file is imported.
 * @param {*} newMeshes 
 * @param {*} particleSystem 
 * @param {*} skeletons 
 * @param {*} objectPosition 
 */
var onTankImported = function (newMeshes, particleSystem, skeletons, objectPosition) {


    //Get the current activated scene by the global variable Game
    var scene = Game.scenes[Game.activeScene];


    var root = scene.getMeshByName('Box');

    var tank = new Tank(newMeshes, root, scene, -1, 4, newMeshes[0].name, 'red', false);


    var spawnPosition = new BABYLON.Vector3(0.0, 1.6, -900.52);
    //Adjust the spwaning position of the hero tank.
    tank.setSpawnPoint(spawnPosition);
    tank.teleportSpawn();


    /**Add the heroTank to the scene in order to have it available. With 
     * scene.heroTank we store the Object not the mesh.
    */
    scene.heroTank = tank;



    /*
    for(var i =0 ; i<scene.meshes.length; ++i){
        console.log(scene.meshes[i].name);
    }
    */

    

    /**
     * Spawn the opponent tanks (blue team tanks) on the other side of the map. The 
     * number of tanks is determined by the difficulty of the game. An "easy" game will
     * spawn just two blue tanks, whereas a "hard" game will spawn 4 tanks. 
    */
    if (difficulty == 'easy') {
        for (var i = 0; i < MAX_NUM_TANK_EASY; ++i) {


            //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.
            var clone = DoClone(tank.root, null, i + 1);
            var blueTank = new Tank(clone, clone, scene, i + 1, 4, 'clone_'.concat((i + 1).toString()), 'blue', true);


            //Spawn the opponent tanks in a row.

            
            var xPosition = 100 * Math.pow(-1, i) + 100 * i;
            var spawnPosition = new BABYLON.Vector3(xPosition,1.6,900.52);
            

            blueTank.setSpawnPoint(spawnPosition);
            blueTank.teleportSpawn();



        }


    }

    else {

        for (var i = 0; i < MAX_NUM_TANK_HARD; ++i) {

            //Clone a tank (from the hero tank) and istantiate a Tank object that represents the blue team tank.
            var clone = DoClone(tank.root, null, i + 1);
            var blueTank = new Tank(clone, clone, scene, i + 1, 4, 'clone_'.concat((i + 1).toString()), 'blue', true);




            var xPosition = 100 * Math.pow(-1, i) + 100 * i;
            var spawnPosition = new BABYLON.Vector3(xPosition,1.6,900.52);
            

            blueTank.setSpawnPoint(spawnPosition);
            blueTank.teleportSpawn();

        }

    }



    //Define the parameters of the hero tank follow camera (TPS like camera) and create the FollowCameraObject.
    var heroTankFollowCamera = {
        'radius': 70,
        'heightOffset': 25,
        'rotationOffset': 0,
        'cameraAcceleration': 0.5,
        'maxCameraSpeed': 50
    };
    var heroTankFollowCamera = createFollowCamera(scene, root, heroTankFollowCamera, "heroTankFollowCamera");
    if (heroTankFollowCamera) {
        scene.heroTankFollowCamera = heroTankFollowCamera;
        scene.activeCamera = heroTankFollowCamera;

    }
    else {
        alert("Error in creating the follow camera with name heroTankFollowCamera");
    }



    //Enable the Tank crosshair
    //loadTankCrosshair(scene);


    return newMeshes;
}






/**
 * 
 * @param {*} scene 
 * @param {*} tank 
*/

var loadTankCrosshair = function (scene, tank) {

    //Let's make a tiny box for impact
    var impact = new BABYLON.Mesh.CreateBox("impact", .1, scene);


    /**Remember that all the cameras have a near and a far plane. Each and every object that is 
    * rendered "before" the near plane and "after" the far plane are not rendered by the camera.
    * Keep it in mind whenever using a camera that those parameters determine what you can see and what
    * you cannot see. Actually  z= 0.1 is "before" the near plane.
    * camera.minZ and camera.maxZ are the fields that store this value.
    */


    impact.position.z += 3.8;
    impact.position.y += 0.8;


    if (scene.heroTankFollowCamera) {
        var camera = scene.heroTankFollowCamera;
    }


    impact.parent = camera;
    impact.material = new BABYLON.StandardMaterial("impact", scene);
    impact.material.diffuseTexture = new BABYLON.Texture("texture/crosshair.png", scene);
    impact.material.emissiveColor = new BABYLON.Color3.Red();

    //Is a PNG image so it has a transparency.
    impact.material.diffuseTexture.hasAlpha = true;
    impact.isPickable = false;



    //We will make the impact available through the scene.
    scene.crossHairImpact = impact;


}



/**
 * This is a wrapper function for each and every call to the functions that 
 * animate the tank (move, animateTurret etc ...). This because we want to keep
 * the scene.toRender() function defined in game.js as small as possible.
 * @param {BABYLON.Scene} scene the object representing the current scene.
 * @param {Tank} tank  the object representing the tank to be animated
 */

var startTank = function (scene, tank) {

    tank.move();
    tank.animateTurret(scene);


    if (tank.currentWeapon == Tank.CANNON) {
        //Make the tank able to fire cannonBalls
        tank.fireCannonBalls(scene);
    }
    else if (tank.currentWeapon == Tank.MACHINE_GUN) {
        //Make the tank able to fire with the gun 
        tank.fireGun(scene);
    }
}



var startBlueTeamTanks = function (scene) {
    if (scene != Game.scenes[Game.activeScene])
        return;

    if (managing_blueTanksArray) return;

    if (!scene.blueTanks) return;

    if (!scene.heroTank) return;

    //Collect all the blue team tanks.
    var blueTeamTanks = scene.blueTanks;

    //Get the heroTank
    var heroTank = scene.heroTank;

    for (var i = 0; i < blueTeamTanks.length; ++i) {


        //This function will now return the distance vector.
        var distance = blueTeamTanks[i].followTank(heroTank.root);
        
        /**The enemy tanks will  if (proba <= blueTeamTanks[i].probaValue) {
            have a close to random behaviour. 
         * Sample from a uniform distribution and determine whether the tank should shoot to 
         * the heroTank or not. use a predeInside this function the tank is pushed to the blueTanks array.fined random constant. 
        */

        var proba = Math.random();
        if (proba <= blueTeamTanks[i].probaValue) {
            
            
            
            proba = Math.random();


            //Define a random behaviour.
            if (proba <= blueTeamTanks[i].probaValue) {
                if (blueTeamTanks[i].currentWeapon == Tank.CANNON)
                    blueTeamTanks[i].currentWeapon = Tank.MACHINE_GUN;
                else
                    blueTeamTanks[i].currentWeapon = Tank.CANNON;
            }


            //Shoot at the player tank if and only if the opponent tank is relatively near.
            if(distance <= Tank.AI_SHOOTING_DISTANCE){
                if (blueTeamTanks[i].currentWeapon == Tank.CANNON)
                    blueTeamTanks[i].fireCannonBalls(scene);
                else if (blueTeamTanks[i].currentWeapon == Tank.MACHINE_GUN)
                    blueTeamTanks[i].fireGun(scene);
                }
        }



    }
    return;

}




var respawnTanks = function (scene) {

    //The maximum number of opponent tanks is 2.
    if (difficulty == 'easy') {

        var blueTanks = scene.blueTanks;
        if (blueTanks) {
            if (blueTanks.length < MAX_NUM_TANK_EASY) {

                //We clone the tank from the heroTank
                var heroTank = scene.heroTank;
                if (heroTank) {
                    globalCloneTankId = globalCloneTankId + 1;
                    var respawnedTank = DoClone(heroTank, null, globalCloneTankId);

                    var randomX = Math.floor(Math.random() * 100) + 3;
                    var respawnedTankPosition = new BABYLON.Vector3(randomX, 1.6, 1000);

                    respawnedTank = new Tank(respawnedTank, respawnedTank, scene, globalCloneTankId,
                        4, 'clone_'.concat(globalCloneTankId.toString()), 'blue', true);

                    scene.blueTanks.push(respawnedTank);
                    respawnedTank.moveTank(respawnedTankPosition);

                }
            }
        }
    }
    else {
        var blueTanks = scene.blueTanks;
        if (blueTanks) {
            if (blueTanks.length < MAX_NUM_TANK_HARD) {

                //We clone the tank from the heroTank
                var heroTank = scene.heroTank;
                if (heroTank) {
                    globalCloneTankId = globalCloneTankId + 1;
                    var respawnedTank = DoClone(heroTank, null, globalCloneTankId);

                    var randomX = Math.floor(Math.random() * 100) + 3;
                    var respawnedTankPosition = new BABYLON.Vector3(randomX, 1.6, 1000);

                    respawnedTank = new Tank(respawnedTank, respawnedTank, scene, globalCloneTankId,
                        4, 'clone_'.concat(globalCloneTankId.toString()), 'blue', true);


                    respawnedTank.moveTank(respawnedTankPosition);

                }
            }
        }
    }

}





/**
 * This function register an action for the hero tank for each and every loot box that is 
 * rendered in the scene. Whenever the hero tank touches one of the loot boxes it collects
 * the benefits (bullets, health, life points). The loot box should disappear afterwards.
 * @param {BABYLON.Scene} scene the object representing the scene.
*/
var registerLootBoxTriggers = function (scene) {


    /**
     * A series of sanity checks. 
    */

    if (!scene) return;

    if (!scene.heroTank) return;

    if (!scene.blueTanks) return;
    if (!scene.redTanks) return;

    if (!scene.lootBoxes) return;


    /**
     * Collect the number of boxes that are present in the scene. It depends on the difficulty
     * of the game. 
    */
    var numLootBoxes;
    if (difficulty == 'easy')
        numLootBoxes = NUM_LOOTBOXES_EASY;
    else if (difficulty == 'hard')
        numLootBoxes = NUM_LOOTBOXES_HARD;


    //Collect all the objects from the scene object.
    var lootBoxes = scene.lootBoxes;
    var heroTank = scene.heroTank;
    var heroTankBody = heroTank.getBody();


    //Register the action manager for the "body" of the tank.
    heroTankBody.actionManager = new BABYLON.ActionManager(scene);



    lootBoxes.forEach(function (box) {

        //Register an action for each of the loot boxes.
        heroTankBody.actionManager.registerAction(new BABYLON.ExecuteCodeAction(

            {
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: box.lootBox
            },

            function () {

                //Dispose the loot box and free some memory.
                box.lootBox.dispose();


                /**
                 * Depending on the type of box that is hit, the hero tank will obtain
                 * a different bonus/malus (to be implemented). 
                */
                switch (box.type) {
                    case 'health': {

                        heroTank.increaseHealth(INCREASE_LIFE_POINTS_LOOTBOX);

                        var theBox = box;
                        var theScene = scene;

                        //After a time that depends on LOOT_BOX_RESPAWN_TIME the loot box must respawn.
                        setTimeout(function () {

                            var index = theBox.index;
                            var position = new BABYLON.Vector3(theScene.lootBoxesPosition[index].x,
                                theScene.lootBoxesPosition[index].y, theScene.lootBoxesPosition[index].z);
                            theBox.lootBox = new BABYLON.Mesh.CreateBox('lootBox'.concat((index).toString()), LOOT_BOX_SIZE, theScene);
                            theBox.lootBox.position = position;

                            var urlTexture = 'texture/cubeTextures/hearth/health';
                            var index = theBox.index;
                            var scale = 5;
                            texturizeLootBox(scene, theBox, urlTexture, index, scale);
                            animateLootBoxes(scene,theBox);

                        }, LOOT_BOX_RESPAWN_TIME);

                        break;
                    }

                    case 'machineGunBullet': {

                        heroTank.increaseMachineGunBullets(INCREASE_BULLETS_MACHINE_GUN_LOOTBOX);

                        var theBox = box;
                        var theScene = scene;

                        //After a time that depends on LOOT_BOX_RESPAWN_TIME the loot box must respawn.
                        setTimeout(function () {

                            var index = theBox.index;
                            var position = new BABYLON.Vector3(theScene.lootBoxesPosition[index].x,
                                theScene.lootBoxesPosition[index].y, theScene.lootBoxesPosition[index].z);
                            theBox.lootBox = new BABYLON.Mesh.CreateBox('lootBox'.concat((index).toString()), LOOT_BOX_SIZE, theScene);
                            theBox.lootBox.position = position;

                            var urlTexture = 'texture/cubeTextures/machinegun/machinegun';
                            var index = theBox.index;
                            var scale = 5;
                            texturizeLootBox(scene, theBox, urlTexture, index, scale);
                            animateLootBoxes(scene,theBox);


                        }, LOOT_BOX_RESPAWN_TIME);

                        break;
                    }


                    case 'cannonBullet': {

                        heroTank.increaseCannonBullets(INCREASE_BULLETS_CANNON_LOOTBOX);

                        var theBox = box;
                        var theScene = scene;

                        //After a time that depends on LOOT_BOX_RESPAWN_TIME the loot box must respawn.
                        setTimeout(function () {

                            var index = theBox.index;
                            var position = new BABYLON.Vector3(theScene.lootBoxesPosition[index].x,
                                theScene.lootBoxesPosition[index].y, theScene.lootBoxesPosition[index].z);
                            theBox.lootBox = new BABYLON.Mesh.CreateBox('lootBox'.concat((index).toString()), LOOT_BOX_SIZE, theScene);
                            theBox.lootBox.position = position;

                            var urlTexture = 'texture/cubeTextures/cannonball/cannonball';
                            var index = theBox.index;
                            var scale = 5;
                            texturizeLootBox(scene, theBox, urlTexture, index, scale);
                            animateLootBoxes(scene,theBox);


                        }, LOOT_BOX_RESPAWN_TIME);

                        break;
                    }

                    case 'point': {

                        heroTank.tankStatus.points = heroTank.tankStatus.points + 1;

                        var theBox = box;
                        var theScene = scene;

                        //After a time that depends on LOOT_BOX_RESPAWN_TIME the loot box must respawn.
                        setTimeout(function () {

                            var index = theBox.index;
                            var position = new BABYLON.Vector3(theScene.lootBoxesPosition[index].x,
                                theScene.lootBoxesPosition[index].y, theScene.lootBoxesPosition[index].z);
                            theBox.lootBox = new BABYLON.Mesh.CreateBox('lootBox'.concat((index).toString()), LOOT_BOX_SIZE, theScene);
                            theBox.lootBox.position = position;

                            var urlTexture = 'texture/cubeTextures/coin/coin';
                            var index = theBox.index;
                            var scale = 5;
                            texturizeLootBox(scene, theBox, urlTexture, index, scale);
                            animateLootBoxes(scene,theBox);


                        }, LOOT_BOX_RESPAWN_TIME);

                        break;
                    }

                    default: {

                        console.log("Unrecognized loot box");
                        break;
                    }
                }

            }));

    });

}







/**
 * This function register an out of map trigger. Whenever a tank (blue team tank, red team tank) 
 * reaches the border of the map, it will be automatically teleported to its spawn position.
 * It is a very  basic "out of map" trigger strategy.
 * @param {BABYLON.Scene} scene the object representing the scene.
 */
var registerOutsideOfMapTrigger = function (scene) {
    if (!scene || Game.scenes[Game.activeScene] != scene) return;
    if (!scene.ground) return;


    var ground = scene.ground;


    if (!scene.heroTank) return;


    var heroTank = scene.heroTank;

    

    
    /**
     * Register an "out of map" trigger for each tank team. 
    */

    //For the blue tank team.
    if(!scene.blueTanks || !scene.redTanks) return; 

    scene.blueTanks.forEach(function(tank){
        
        var tankPosition = tank.root.getAbsolutePosition();
        //Move the tank back to the spawn position.
        if(Math.abs(tankPosition.x) >= (ground._width/2) || Math.abs(tankPosition.z) >= (ground._height/2)){
            //Teleport the tank to the spawn point if it goes outside of the map.
            tank.teleportSpawn();
        }

    });
    
    //For the red tank team.
    scene.redTanks.forEach(function(tank){
        
        var tankPosition = tank.root.getAbsolutePosition();
        //Move the tank back to the spawn position.
        if(Math.abs(tankPosition.x) >= (ground._width/2) || Math.abs(tankPosition.z) >= (ground._height/2)){
            //Teleport the tank to the spawn point if it goes outside of the map.
            tank.teleportSpawn();
        }

    });



    
}