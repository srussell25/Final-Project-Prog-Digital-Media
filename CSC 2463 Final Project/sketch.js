let startButton;
let restartButton;
let gameStarted = false;
let port;
let lastSpawnTime = 0;
let gameStartTime = 0;
let gameTime = 0;
let joyX, joyY, sw = 0;
let user;
let prevX, prevY;
let prevSW = 0;
let connectButton;
let cleared = false;
const enemySpawnInterval = 10000; // 10 seconds
let enemies = []; //unspecified array of enemies since they will be increasing over time
let melody1 = ["C3", ["E3", "G3", "D3", "C3"],
"A3", "B2", "C2", "E3",
["A2", "G2"],
 "C4"];
 let square;
 let speed = 1.5;

function setup() {
  createCanvas(800, 800);
  startButton = createButton('Start Game');
  startButton.position(width/ 2 - 60, height / 2 + 300);
  startButton.mousePressed(startGame);

  connectButton = createButton("Connect");
  connectButton.position(width / 2 - 53, height / 2 + 350);
  connectButton.mousePressed(connect);

  restartButton = createButton("Restart");
  restartButton.position(width / 2 - 50, height / 2 + 50);
  restartButton.mousePressed(restartGame);
  restartButton.hide();

  // Initialize serial port
  port = createSerial();

  user = new Player(width/2, height/2, 10); 

  // Find and open serial port
  let usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], 57600);
  }
  frameRate(90);


  square = new Tone.Synth({
    oscillator: {
      type: "square"
    },
    envelope: {
      attack: 0.4,
      decay: 0.2,
      sustain: 1,
      release: 0.3
    }
  }).toDestination();
}

function draw() {
  background(220);

  // Update game time
  if (gameStarted) {
    gameTime = millis() - gameStartTime;
    joyStickData();
  }

  // Display game time
  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text("Time: " + (gameTime / 1000).toFixed(1) + " seconds", 10, 10);

  // Game over Sequence
  if (!gameStarted && gameTime > 0) {
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Game over. Score: " + floor(gameTime / 1000) + " seconds", width / 2, height / 3);
    restartButton.show();
  }

  // Display start menu items if game not started
  if (!gameStarted) {
    textSize(30);
    textAlign(CENTER, CENTER);
  }

  if(gameStarted && user){
    fill(0);
    textSize(24);
    text("Stay away from enemies as long as possible!", width / 3, height / 3);
    user.update();
    user.display();
    //updates enemies
    for(let enemy of enemies){
      enemy.update(); 
      enemy.display();
      // Check for collision with user
      if (enemy.hits(user)) {
        gameStarted = false;
      }
    }
    if(millis() - lastSpawnTime > enemySpawnInterval){
      spawnEnemies();
      lastSpawnTime = millis();
    }
  }
}

function spawnEnemies(){
 // enemies = [];
  
  for(let i = 0; i < 5; i++){
    let x,y,d;
    do {
      y = random(width);
      x = random(height);
      d = user.distance(x,y);
      console.log(d);
    } while (d < 50);
    
    let enemy = new Enemy(x, y, 30);
    enemies.push(enemy);
  }
}

function joyStickData() {
  if (gameStarted && user) {
    let latest = port.readUntil("\n");
    if (latest) {
      let values = latest.split(",");
      if(cleared == false){  
      if (values.length > 2) {
        joyX = (Number(values[0]));
        console.log(values);
        joyY = (Number(values[1]));
        sw = Number(values[2]);
      }
    }
       cleared = false;
       if(frameCount % 600 == 0){
        port.clear();
        cleared = true;
       }
      if (joyX > 0) {
        user.x += speed;
      } else if (joyX < 0) {
        user.x -= speed;
      }
  
      if (joyY > 0) {
        user.y += speed;
      } else if (joyY < 0) {
        user.y -= speed;
      }
    }
  }
    prevX = user.x;
    prevY = user.y;
    prevSW = sw;
  }
// function joyStickData() {
//   if (port.available() > 0 && gameStarted && user) {
//     let latest = port.readUntil("\n").trim();
//     if (latest) {
//       let values = latest.split(",");
//       if (values.length > 2) {
//         let joyX = Number(values[0]);
//         let joyY = Number(values[1]);
//         let sw = Number(values[2]);

//         if (joyX > 0) {
//           user.x += speed;
//         } else if (joyX < 0) {
//           user.x -= speed;
//         }
  
//         if (joyY > 0) {
//           user.y += speed;
//         } else if (joyY < 0) {
//           user.y -= speed;
//         }
//       }
//     }
//   }
// }

function connect() {
  if (!port.opened()) {
    port.open('Arduino', 57600);
  } else {
    port.close();
  }
}

function startGame() {
  gameStarted = true;
  gameStartTime = millis();
  text("Click the Start Button to begin", width / 3, height / 3);
  square.triggerAttackRelease("G3", 0.7);
  startButton.hide();
 // clearCanvas(); //clear canvas for game, phase 1 done.
  spawnEnemies();
}

function clearCanvas() {
  fill(255);
  square.triggerAttackRelease("C4",0.8);
}

function restartGame() {
  gameStarted = false;
  gameTime = 0;
  startButton.show();
  restartButton.hide();
  enemies = [];
  square.triggerAttackRelease("E3", 0.8);
}

class Player {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = 1.12;
  }
  
  move(xMovement, yMovement) {
    // Move user based on joystick input
    this.x += xMovement * this.speed;
    this.y += yMovement * this.speed;
    
    // Constrain user within canvas boundaries
    this.x = constrain(this.x, 0 + this.r/2, width - this.r/2);
    this.y = constrain(this.y, 0 + this.r/2, height - this.r/2);
  }
  
  update() {
    //don't need but will keep here as a placeholder.
  }
  
  display() {
    fill('black'); // black color for user
    ellipse(this.x, this.y, this.r);
  }

  distance(x,y) {
    let xDiff = this.x - x;
    let yDiff = this.y - y;
    return Math.sqrt(xDiff*xDiff+yDiff*yDiff);
  }
}

class Enemy {
  constructor(x, y, side) {
    this.x = x;
    this.y = y;
    this.side = side;
    this.speed = 0.56;
  }
  
  update() {
    // Move enemy
    //this.x += random(-this.speed, this.speed);
    //this.y += random(-this.speed, this.speed);
    let xDiff = user.x - this.x;
    let yDiff = user.y - this.y;
    let d = user.distance(this.x, this.y);
    this.x += (xDiff / d) * this.speed;
    this.y += (yDiff / d) * this.speed;

    // Constrain enemy within canvas boundaries
    this.x = constrain(this.x, 0, width);
    this.y = constrain(this.y, 0, height);
  }
  
  display() {
    fill(255, 0, 0); // Red color for enemies
    rectMode(CENTER);
    rect(this.x, this.y, this.side, this.side);
  }

  // Check collision with player
  hits(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    if (d < this.side / 2 + player.r / 2) {
      return true;
    } else {
      return false;
    }
  }
}