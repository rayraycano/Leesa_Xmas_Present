////Raymond Cano
////three.js source code for leesa's christmas present



function addSnowman() {
    //initial addition of an item

    //ball1
    var ballGeom = new THREE.DodecahedronGeometry(80,1);
    var material = new THREE.MeshLambertMaterial({ color: snowColor});
    var firstBall = new THREE.Mesh(ballGeom, material);
    scene.add(firstBall);
    firstBall.position.set(0, 70, 0);
    //ball 2
    var ballGeom2 = new THREE.DodecahedronGeometry(60, 1);
    var secondBall = new THREE.Mesh(ballGeom2, material);
    scene.add(secondBall);
    secondBall.position.set(0, 190, 0);
    //ball3
    var ballGeom3 = new THREE.DodecahedronGeometry(30, 1);
    var thirdBall = new THREE.Mesh(ballGeom3, material);
    scene.add(thirdBall);
    thirdBall.position.set(0, 260, 0);

    //eyes
    var sphere = new THREE.SphereGeometry(5);
    var eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var eye1 = new THREE.Mesh(sphere, eyeMaterial);
    scene.add(eye1);
    eye1.position.set(15, 275, 20);

    var sphere2 = new THREE.SphereGeometry(5);
    var eye2 = new THREE.Mesh(sphere2, eyeMaterial);
    scene.add(eye2);
    eye2.position.set(-15, 275, 20);
    //nose
    var cone = new THREE.CylinderGeometry(7, 0, 20);
    var noseMaterial = new THREE.MeshLambertMaterial({ color: 0xffa321 });
    var nose = new THREE.Mesh(cone, noseMaterial);
    scene.add(nose);
    nose.position.set(0, 265, 40);
    nose.rotation.set(-3.14159 / 2, 0, 0);
    //smile
    var ring = new THREE.RingGeometry(15,17,20,20,5*Math.PI/4, Math.PI/2);
    var smile = new THREE.Mesh(ring, eyeMaterial);
    scene.add(smile);
    smile.position.set(0, 265, 28);
}

function addText() {
    parameters = {
        size: 50,
        height: 3,
        font: "gentilis",
        bevelEnabled: true,
        bevelThickness: 5,
        bevelSize: 4
    }
    var textGeom = new THREE.TextGeometry("Yo u r  S m a r t", parameters);
    var textMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var text = new THREE.Mesh(textGeom, textMat);
    scene.add(text);
    text.position.set(-225, 300, 0);
    
}

function addFloor(color) {

    //Add Ground
    

    var plane = new THREE.BoxGeometry(1000, 1000,10);
    var floorMaterial = new THREE.MeshBasicMaterial({ color: color });
    var floor = new THREE.Mesh(plane, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.set(0,0,0);
    scene.add(floor); 
    floor.name = 'floor';

}

function generateSnow() {
    //add snowfall to the scene at certain rate
    //generate random number of snowballs
    //place each in random location
    var rand = Math.random();
    if (rand < snowRate) {
        var mesh = new THREE.Mesh(snowGeometry, snowMat);
        mesh.position.x = (Math.random() - 0.5) * 1000;
        mesh.position.z = (Math.random() - 0.5) * 1000;
        mesh.position.y = 400;
        mesh.updateMatrix();
        scene.add(mesh);
        snow.push({ mesh: mesh, fallRate: Math.random() * .2 });
       
    }
}

function snowfall() {
    //send snow down
    for (var x = 0; x < snow.length; x++) {
        if (snow[x].mesh.position.y > 0) {
            snow[x].mesh.position.y -= snow[x].fallRate;
            snow[x].mesh.updateMatrix();
        }
    }
    
}

var snowColor = 0xe6e08c;
var container, stats;

var camera, controls, scene, renderer;
var snow = []; var snowRate = .04;
var cross;

var snowGeometry = new THREE.SphereGeometry(5);
var snowMat = new THREE.MeshLambertMaterial({ color: snowColor });


init();
animate();

function init() {
    

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(9.866247820078698, 400.3218566559581, 515.2997605334697);
    //camera.quaternion.set(0.9832173912883538, -0.18100187932589176, 0.02246696023949332, 0.004135974725518496);
    //camera.updateProjectionMatrix();

    controls = new THREE.OrbitControls(camera);
    
    controls.addEventListener('change', render);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xbbbbbb, 0.001);

    // world

    addFloor(0xf0f0f0);
    
    addSnowman();
    addText();

    //add snow fall

    //var geometry = new THREE.CylinderGeometry(0, 10, 30, 4, 1);
    //var material = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading });

    //for (var i = 0; i < 500; i++) {

        //var mesh = new THREE.Mesh(geometry, material);
        //mesh.position.x = (Math.random() - 0.5) * 1000;
        //mesh.position.y = (Math.random() - 0.5) * 1000;
        //mesh.position.z = (Math.random() - 0.5) * 1000;
    //    mesh.updateMatrix();
    //    mesh.matrixAutoUpdate = false;
    //    scene.add(mesh);

    //}


    // lights

    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);

    light = new THREE.AmbientLight(0x222222);
    scene.add(light);


    // renderer

    renderer = new THREE.WebGLRenderer({ antialias: false });
    //renderer.setClearColor(scene.fog.color, 1);
    renderer.setClearColor(0xffffff);
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
    render();
    generateSnow();
    snowfall();

}

function render() {
    renderer.render(scene, camera);
}