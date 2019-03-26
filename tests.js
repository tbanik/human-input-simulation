const HIS = require('.');

const Rand = (l,u) => ~~(Math.random()*(u-l+1)+l);

/* let total = 0;
let mouse;
const move_to_random = () => {
    let screen = HIS.getScreenSize();
    mouse = HIS.getMousePos();
    HIS.moveMouse({
        xStart: mouse.x,
        yStart: mouse.y,
        xEnd: Rand(100,screen.width-100),
        yEnd: Rand(120,screen.height-100),
        tolerance: 0,
        confidence: 0.7,
        fatigue: 0.3
    });

    total++;
    if(total == 1) HIS.mouseToggle('down');
    if(total <=6) {
        mouse = HIS.getMousePos();
        HIS.idleMouse({
            x: mouse.x,
            y: mouse.y,
            amplitude:Rand(1,3),
            duration:Rand(100,1000)
        })
        move_to_random()
    }
    else HIS.mouseToggle('up');
}

move_to_random() */

let total = 0;
let mouse;
let moves = [[50,50],[250,50],[250,250],[50,250],[50,50],[250,250]]
const move_to_next = () => {
    mouse = HIS.getMousePos();
    HIS.moveMouse({
        xStart: mouse.x,
        yStart: mouse.y,
        xEnd: moves[0][0],
        yEnd: moves[0][1]+103,
        tolerance: 0,
        confidence: 0.7,
        fatigue: 0.3
    });

    total++;
    moves.shift();
    if(total == 1) HIS.mouseToggle('down');
    if(moves.length) {
        mouse = HIS.getMousePos();
        HIS.idleMouse({
            x: mouse.x,
            y: mouse.y,
            amplitude:Rand(1,3),
            duration:Rand(100,1000)
        })
        move_to_next()
    }
    else HIS.mouseToggle('up');
}

move_to_next()


/*
//tolerance test 
mouse = HIS.getMousePos();
HIS.moveMouse(mouse.x,mouse.y, 50, 153, 10, 0.7, 0.3, robot.moveMouse) */



/* let screen = HIS.getScreenSize();
mouse = HIS.getMousePos();
HIS.moveMouse({
    xStart: mouse.x,
    yStart: mouse.y,
    xEnd: Rand(100,screen.width-100),
    yEnd: Rand(120,screen.height-100),
    tolerance: 0,
    confidence: 0.7,
    fatigue: 0.3
});

HIS.mouseClick();

for (let index = 0; index < 10; index++) {
    HIS.typeString({
        string: 'The quick brown fox jumps over the lazy dog.\n',
        tolerance: 0,
        confidence: 0.9,
        fatigue: 0.4,
        speed:1
    })
} */