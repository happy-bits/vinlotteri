// todo: Skapa en theme-mapp
// todo: Start-bild-skärm
// todo: Bakgrundsbild för spelet
// todo: I URL'en kunna ange spelarna och hur många av varje
// todo: Ringa in vinnaren
// todo: Ljudeffekt när någon skjuts ut eller vinner
// todo: Musik vid introskärmen

const Vinlotteri = function () {

    let gameState = "click-to-start"

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
                    texture: `./dearfriends/${name}.png`
                }
            },
            extra: {
                who: name // extra parameter
            }
        });
    }

    function createWallOfCircles() {

        const vDiff = Math.PI / 60;
        const options = { isStatic: true };
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

    // Static = påverkas inte av tyngdkraften (kan ej ändra position eller angle)
    // Properties för ett objekt https://brm.io/matter-js/docs/classes/Body.html#properties

    world.bodies = [];

    Composite.add(world, createWallOfCircles());

    // Lägg till bollar till världen

    const bollar = []

    //bollar.push(createBoll('oscar'))


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
                // texture: `./dearfriends/drunk-172-200.png`
                texture: `./dearfriends/drunk-172-200-transparent.png`
                //texture: `./dearfriends/wineguy.png`,
                //texture: `./dearfriends/gerard1.png`,
                //texture: `./dearfriends/gerard1b.png`,
                //texture: `./dearfriends/gerard2.png`,
                //texture: `./dearfriends/gerard3.png`,
            }
        },
        extra: {
            noseDefaultAngle: 2.8 // drunk
            //noseDefaultAngle: 0, // wineguy
            //noseDefaultAngle: 0.3 // gerard2
            //noseDefaultAngle: -0.2 // gerard4
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

    positionNose()

    // Body.setStatic(nose, true)
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
    document.body.onclick = () => {

        /////console.log("time", time)

        Runner.run(runner, engine);

        setInterval(() => {
            time += 100
            onePlus = 1 + Math.pow(time / 6000, 2)

        }, 100)

        setInterval(() => {

            if (gameState === "player-has-won") {
                Runner.stop(runner, engine)
                return
            }
            mixer.angle += 0.6 / onePlus
            positionNose()

            moveAgainstWall()
            checkWhoIsClosesedToNose()
            checkIfSomeHasWon()
            console.log(time)

        }, 100)

    }

};

