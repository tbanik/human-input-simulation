const M = Math,
robot = require('robotjs'),
Distance = (x1,y1,x2,y2) => M.sqrt(M.pow(x2-x1,2)+M.pow(y2-y1,2)),
Hypot = (x,y) => M.sqrt(M.pow(x,2)+M.pow(y,2)),
Rand = (l,u) => ~~(M.random()*(u-l+1)+l),
wait = (ms, s=Date.now(), n=s) => {while (n-s < ms) n = Date.now()};

//set robots defaults to 0 so we can use generated values
robot.setMouseDelay(0);
robot.setKeyboardDelay(0);

//TODO
// add global overshoot?
const moveMouse = ({xStart, yStart, xEnd, yEnd, tolerance, confidence, fatigue}) => {
    let veloX = 0, veloY = 0, forceX = 0, forceY = 0;
    const sqrt2 = M.sqrt(2), sqrt3 = M.sqrt(3), sqrt5 = M.sqrt(5);

    const tDist = Distance(M.round(xStart), M.round(yStart), M.round(xEnd), M.round(yEnd));
    const t = (new Date().getTime() + 10000);

    let force1 = M.max(6,10*fatigue);
    let force2 = M.max(10*fatigue, 4-(4*confidence));
    let targetRadius = 100-(100*confidence);
    let dist;

    const applyForce = () => {
        if (new Date().getTime() > t) return;

        dist = M.max(1,Hypot(xStart - xEnd, yStart - yEnd));
        force2 = M.min(force2, dist);

        let d = M.max(5, M.min(25, (M.round(M.round(tDist) * 0.3) / 7)));

        let rCnc = Rand(0,6);
        if (rCnc == 1) d=2;

        let maxStep = d <= M.round(dist) ? d : M.round(dist);

        if (dist >= targetRadius){
            forceX = forceX / sqrt3 + (Rand(0,(M.round(force2) * 2 + 1)) - force2) / sqrt5;
            forceY = forceY / sqrt3 + (Rand(0,(M.round(force2) * 2 + 1)) - force2) / sqrt5;
        }else{
            forceX = forceX / sqrt2;
            forceY = forceY / sqrt2;
        }

        veloX = veloX + forceX;
        veloY = veloY + forceY;
        veloX = veloX + force1 * (xEnd - xStart) / dist;
        veloY = veloY + force1 * (yEnd - yStart) / dist;

        if (Hypot(veloX, veloY) > maxStep){
            let randomDist = maxStep / 2.0 + Rand(0,(M.round(maxStep) / 2));
            let veloMag = M.sqrt(veloX * veloX + veloY * veloY);
            veloX = (veloX / veloMag) * randomDist;
            veloY = (veloY / veloMag) * randomDist;
        }

        let pX = ~~(xStart); xStart = xStart + veloX;
        let pY = ~~(yStart); yStart = yStart + veloY;
        
        if (pX != ~~(xStart) || (pY != ~~(yStart))) robot.moveMouse(~~(xStart), ~~(yStart));
        
        let speed = Rand(2-(2*confidence),6-(6*confidence));
        speed *= (3*fatigue);
        let pDist = 1-(dist/tDist);
        
        if(!(Hypot(xStart - xEnd, yStart - yEnd) < 1)){
            if(dist < targetRadius) wait((speed*20)*pDist);
            else wait((speed*pDist)+(10-(10*confidence)));

            if(!(dist <= tolerance)) applyForce();
        }
    }

    applyForce()

    if (((~~(xEnd) != ~~(xStart)) || (~~(yEnd) != ~~(yStart))) && !(dist <= tolerance)) robot.moveMouse(~~(xEnd), ~~(yEnd));

}



const idleMouse = ({x, y, amplitude, duration}) => {

    let start = Date.now(), now=start, stretch = Rand(1,2), time = 3000*(1+amplitude*0.1), count = 0;
    while (now-start < duration){

        let progress, tx, ty;

        progress = (now - start) / (time/200) / 1000;
        progress -= count;

        tx = M.sin(progress * 2 * M.PI);
        ty = stretch * M.cos(progress * 2 * M.PI);

        let pInt = progress<1 ? amplitude*(progress) : amplitude*(2-(progress));

        let angle = 360*progress/2;
        let rotX = (pInt * tx)*M.cos(angle) - (pInt * ty)*M.sin(angle);
        let rotY = (pInt * ty)*M.cos(angle) - (pInt * tx)*M.sin(angle);

        robot.moveMouse(x+rotX,y+rotY)

        if(progress >= 2) count+=2;
        wait(Rand(3,100))
        now = Date.now();
    }

}



//TODO
//add autocomplete? type a few chars and then send the rest of the word?
//add correction "notice" padding. meaning the person didnt notice the error until a few keystrokes later and has to either backspace multiple times or move their cursor backwards
const typeString = ({string, tolerance, confidence, fatigue, speed}) => {

    const qwerty = {
        "normal": ["1234567890-=","qwertyuiop[]","asdfghjkl;'","zxcvbnm,./"],
        "shift" : ["!@#$%^&*()_+","QWERTYUIOP{}","ASDFGHJKL:\"","ZXCVBNM<>?"]
    };

    //define types of typos that can occur (will add more in later versions)
    const types = [
        (char) => { // skip char
            return {key: null, typo: true, fix: char}
        },
        (char) => { //double press key
            return [
                {key: char, typo: false},
                {key: char, typo: true}
            ]
        },
        (char) => { // shift accident
            if(qwerty.normal.join('').includes(char)){
                return {
                    key: qwerty.shift.join('')[qwerty.normal.join('').indexOf(char)],
                    typo: true, fix: char
                }
            }else if(qwerty.shift.join('').includes(char)){
                return {
                    key: qwerty.normal.join('')[qwerty.shift.join('').indexOf(char)],
                    typo: true, fix: char
                }
            }else return {key: char, typo: false}
        },
        (char) => { // wrong key typo
            const findKey = (char, array) => {
                let set = array.findIndex(s => s.includes(char));
                let index = array[set].indexOf(char);
                return [set, index];
            }

            const rDir = (array, set, index) => {
                let dir = Rand(0,3);
                switch (dir) {
                    case 0: //up
                        if(!array[set-1] || !array[set-1][index]) rDir(array, set, index);
                        else return array[set-1][index];
                    case 1: //right
                        if(!array[set] || !array[set][index+1]) rDir(array, set, index);
                        else return array[set][index+1];
                    case 2: //down
                        if(!array[set+1] || !array[set+1][index]) rDir(array, set, index);
                        else return array[set+1][index];
                    case 3: //left
                        if(!array[set] || !array[set][index-1]) rDir(array, set, index);
                        else return array[set][index-1];
                }
            }

            if(qwerty.normal.join('').includes(char)){
                let f = findKey(char, qwerty.normal);
                return {
                    key: rDir(qwerty.normal, f[0], f[1]),
                    typo: true, fix: char
                }
            }else if(qwerty.shift.join('').includes(char)){
                let f = findKey(char, qwerty.shift);
                return {
                    key: rDir(qwerty.shift, f[0], f[1]),
                    typo: true, fix: char
                }
            }else return {key: char, typo: false}
        }

    ]

    //do inital typo processing
    let commandList = [];
    [...string].forEach(char => {

        let typo = (()=>{
            let prob = ~~((20*confidence)-fatigue*2);
            if(Rand(0,prob) < 1) return true;
            return false;
        })();


        if(typo){
            let push = types[~~(M.random()*types.length)](char);
            if(Array.isArray(push)) commandList = commandList.concat(push);
            else commandList.push(push);
        }else{
            commandList.push({key: char, typo: false})
        }
        
    })

    
    //check if there are more typos than the tolerance would allow for this string
    let tolAmount = M.round(string.length*tolerance);
    while (commandList.filter((cmd, i) => cmd.typo && (!commandList[i+1] || !commandList[i+1].correction)).length > tolAmount) {
        
        let typoList = [], r = commandList.filter((cmd, i) => {
            if(cmd.typo && (!commandList[i+1] || !commandList[i+1].correction)){
                typoList.push(i)
                return true;
            }
        })
        
        let fix = typoList[~~(M.random()*typoList.length)];

        if(commandList[fix].key == null){
            commandList.splice(fix+1, 0, {
                key: commandList[fix].fix,correction: true
            }); 
        }else if(commandList[fix].fix){
            commandList.splice(fix+1, 0, {
                key: 'delete',correction: true
            },{
                key: commandList[fix].fix,correction: true
            });  
        }else{
            commandList.splice(fix+1, 0, {
                key: 'delete',correction: true
            });       
        }


    }


    //process the command list
    commandList.forEach(cmd => {
        if(cmd.correction) wait(Rand(100,250)); //wait a bit beore making corrections

        if(cmd.key == 'delete') robot.keyTap('backspace');
        else if(cmd.key) robot.typeString(cmd.key);

        let speedm = (100+(10*fatigue)+(10*(1-confidence))) * speed;
        wait(Rand(15,speedm))
    })

}

//TODO
// add scrolling module (will add in future version)

const scrollMouse = ({x, y, confidence, fatigue}) => {
    robot.scrollMouse(x, y);
}

module.exports = {
    //export package for edge cases
    robot,

    //export HER functions
    moveMouse,
    idleMouse,
    typeString,
    scrollMouse,

    //export commonly used unwrapped functions
    mouseClick: robot.mouseClick,
    mouseToggle: robot.mouseToggle,
    getMousePos: robot.getMousePos,
    getPixelColor: robot.getPixelColor,
    getScreenSize: robot.getScreenSize
}