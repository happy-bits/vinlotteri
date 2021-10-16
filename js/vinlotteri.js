// todo: Bakgrundsbild för spelet
// todo: I URL'en kunna ange spelarna och hur många av varje
// todo: Ringa in vinnaren
// todo: Ljudeffekt när någon skjuts ut eller vinner
// todo: Musik vid introskärmen

const Vinlotteri = function () {

    let gameState = "start-screen"
    const themeRoot = "./theme/boring/"
    const backgroundRoot = themeRoot + "background/"

    addStylesheet(themeRoot + "style.css")

    function addStylesheet(fileName) {

        var head = document.head;
        var link = document.createElement("link");

        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = fileName;

        head.appendChild(link);
    }

    function createBoll(name) {
        const t = wall.diameter / 2

        const r = Math.random() * wall.radius - boll.radius;
        const angle = Math.random() * Math.PI * 2;

        const x = r * Math.cos(angle) + wall.radius
        const y = r * Math.sin(angle) + wall.radius

        return Bodies.circle(x, y, 98 / 2, {
            density: 0.0005,
            frictionAir: 0.06,
            restitution: 0.3,
            friction: 0.01,
            render: {
                sprite: {
                    texture: `${themeRoot}${name}.png`
                }
            },
            extra: {
                who: name // extra parameter
            }
        });
    }

    function createWallOfCircles() {

        const vDiff = Math.PI / 60;
        const options = { 
            isStatic: true,
            render:{
                fillStyle: 'transparent',
                strokeStyle: 'transparent',
                lineWidth: 3,
    
            }    
        
        };
        const circles = []

        for (let v = 0; v < Math.PI * 2; v += vDiff) {

            let x = Math.cos(v) * wall.radius + wall.radius
            let y = Math.sin(v) * wall.radius + wall.radius
            circles.push(Bodies.circle(x, y, wall.thickness, options))
        }
        return circles

    }


    const boll = { diameter: 98, radius: 49 }
    const wall = { thickness: 20, diameter: 800, radius: 400 }
    const mixer = { diameter: 172, radius: 172 / 2, angle: 0 }
    let time = 0

    // Kortare alias

    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composites = Matter.Composites,
        Common = Matter.Common,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Composite = Matter.Composite,
        Bodies = Matter.Bodies,
        Vector = Matter.Vector,
        Body = Matter.Body;

    // Setup av engine, värld, rendering, runner

    const engine = Engine.create();
    const world = engine.world;

    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: wall.diameter * 1.5,
            height: wall.diameter * 1.5,
            showAngleIndicator: false,
            wireframes: false
        }
    });

    Render.run(render);

    const runner = Runner.create();

    setupWallOfCircles()

    function setupWallOfCircles() {
        world.bodies = [];
        Composite.add(world, createWallOfCircles());
    }

    const { bollar, mixerBall, nose } = setupBalls()

    positionNose()

    function setupBalls() {

        const bollar = []

        for (let i = 0; i < 7; i++) {
            bollar.push(createBoll('oscar'))
            bollar.push(createBoll('nils'))
            bollar.push(createBoll('macke'))
            bollar.push(createBoll('madde'))

        }
        Composite.add(world, bollar);

        const mixerBall = Bodies.circle(wall.radius, wall.radius, mixer.radius, {
            density: 0.015,  // hög densitet => pressas
            frictionAir: 0.02,
            restitution: 0.8, // 0 => 1. Elastisitet. 0 = ingen studs
            friction: 0.02,   // 0 => 1. O = kan glida länge. 1 = stannar direkt
            render: {
                sprite: {
                    texture: `${themeRoot}mixer.png`
                }
            },
            extra: {
                noseDefaultAngle: 2.8 // drunk
            }
        });

        Composite.add(world, mixerBall)

        const nose = Bodies.circle(mixerBall.position.x, mixerBall.position.y, 10, {
            density: 0.000,
            frictionAir: 0.06,
            restitution: 0.3,
            friction: 0.01,
            opacity: 0
        });



        return { bollar, mixerBall, nose }
    }


    Matter.Sleeping.set(nose, true)

    //Composite.add(world, nose)   // Kommentera för att gömma näsan

    setViewport()

    function positionNose() {
        let noseVector = Vector.create(mixer.radius, 0)

        noseVector = Vector.rotate(noseVector, mixerBall.angle + mixerBall.extra.noseDefaultAngle)

        nose.position.x = mixerBall.position.x + noseVector.x
        nose.position.y = mixerBall.position.y + noseVector.y
    }

    function setViewport() {

        const offset = 100
        Render.lookAt(render, {
            min: { x: -offset, y: -offset },
            max: { x: wall.diameter + offset, y: wall.diameter + offset }
        });

    }

    function moveMixer(endX, endY, force) {

        const position = {
            x: mixerBall.position.x,
            y: mixerBall.position.y
        }


        let forceVector = Vector.create(endX - position.x, endY - position.y)

        forceVector = Vector.normalise(forceVector)

        forceVector = Vector.mult(forceVector, force)

        Matter.Body.applyForce(mixerBall, position, forceVector)

    }

    function moveAgainstWall() {
        const force = 16 / onePlus

        moveMixer(
            wall.radius * Math.cos(mixer.angle) + wall.radius,
            wall.radius * Math.sin(mixer.angle) + wall.radius,
            force
        )
    }

    function rotateMixer() {
        const t = time / 1000
        const rotation = 1.6 / onePlus
        Body.rotate(mixerBall, rotation)
    }

    let closesedBall = null

    function checkWhoIsClosesedToNose() {
        let closesedDistance = 10000000000


        for (let b of bollar) {
            const noseBallVector = Vector.create(
                nose.position.x - b.position.x,
                nose.position.y - b.position.y
            )
            const length = Vector.magnitude(noseBallVector)

            if (closesedBall == null || length < closesedDistance) {
                closesedDistance = length
                closesedBall = b
            }

            // Släck de som är nära näsan
            // if (length < boll.radius + 10) {
            //     b.render.opacity = 0.3
            // }
            b.render.opacity = 0.5
        }

        closesedBall.render.opacity = 1
    }

    function checkWinner() {
        console.log(closesedBall.who)
    }

    let onePlus

    document.body.onkeyup = () => {
        checkWinner()
    }

    function checkIfSomeHasWon() {

        if (time >= 30000) {
            alert(closesedBall.extra.who)
            gameState = "player-has-won"
        }
    }

    function changeBackground(filename, opacity){
        document.getElementById("background").src = backgroundRoot+filename
        document.getElementById("background").style.opacity = opacity
    }

    function showStartScreen() {

        changeBackground("start.png", 1)

        document.body.onclick = () => {

            console.log('Click')
            document.body.onclick = null

            changeBackground("game.png", 0.3)
            
            Runner.run(runner, engine);
            gameState = "playing"
        }
    }

    setInterval(() => {

        switch (gameState) {
            case "start-screen":
                showStartScreen();
                break;

            case "playing":
                time += 100
                onePlus = 1 + Math.pow(time / 6000, 2)
                mixer.angle += 0.6 / onePlus
                positionNose()
    
                moveAgainstWall()
                checkWhoIsClosesedToNose()
                checkIfSomeHasWon()
                console.log(time)                
                break;

            case "player-has-won":
                Runner.stop(runner, engine)
                return                
        }

    }, 100)


};

