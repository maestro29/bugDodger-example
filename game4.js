// Initialize Phaser game
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

var paddle;
var ball;
var bricks;
var score = 0;
var scoreText;
var paddleRotation = 0;

function preload() {
  this.load.image('sky', 'assets/sky.png');
  this.load.image('paddle', 'assets/paddle.png');
  this.load.image('ball', 'assets/bomb.png');
  this.load.image('brick', 'assets/star.png');
}

function create() {
  //  A simple background for our game
  this.add.image(400, 300, 'sky');

  // Create the paddle
  paddle = this.physics.add.image(400, 550, 'paddle').setImmovable().setCollideWorldBounds(true);
  
  // Create the ball
  ball = this.physics.add.image(400, 500, 'ball').setCollideWorldBounds(true).setBounce(1);
  ball.setVelocity(100, -400); // Add this line to set the initial velocity of the ball

  // Add collision between paddle and ball
  this.physics.add.collider(ball, paddle);

  // Create bricks
  bricks = this.physics.add.staticGroup({
    key: 'brick',
    frameQuantity: 40,
    gridAlign: { width: 10, height: 4, cellWidth: 70, cellHeight: 50, x: 112, y: 100 }
  });
  ball.setScale(1.5);
  // Add collision between ball and bricks
  this.physics.add.collider(ball, bricks, hitBrick, null, this);

  // Set up score text
  scoreText = this.add.text(16, 16, 'Score: ' + score, { fontSize: '32px', fill: '#000' });
}

function update() {
  // Move the paddle with left and right arrow keys
  if (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).isDown) {
    paddle.setVelocityX(-600);
  } else if (this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).isDown) {
    paddle.setVelocityX(600);
  } else {
    paddle.setVelocityX(0);
  }
  if (this.input.activePointer.isDown && this.input.activePointer.x < this.game.config.width / 2)
		paddleRotation -= 0.05;
	else if (this.input.activePointer.isDown && this.input.activePointer.x > this.game.config.width / 2)
    paddleRotation += 0.05;
  paddle.rotation = paddleRotation; 

  // Restart the game if the ball falls below the paddle
  if (ball.y > 585) {
    ball.disableBody(true, true);
    this.add.text(250, 300, 'Game Over', { fontSize: '64px', fill: '#000' });
    this.add.text(270, 370, 'Click to Restart', { fontSize: '32px', fill: '#000' });

    this.input.on('pointerdown', function() {
    this.scene.restart();
    score = 0;
  }, this);
  }
}

function hitBrick(ball, brick) {
  brick.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (bricks.countActive() === 0) {
    // All bricks destroyed, restart the game
    this.scene.restart();

    // score = 0;
  }
}