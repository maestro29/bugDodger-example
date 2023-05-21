// Create a new Phaser game instance with the desired size and renderer
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
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

var player;
var bullets;
var cursors;
var score = 0;
var scoreText;
var hpBar;
var hpBarWidth = 200;
var hpBarHeight = 20;
var maxHP = 100;
var currentHP = maxHP;

function preload() {
    // Load the player and bullet sprites
    this.load.image('player', 'assets/codey.png');
    this.load.image('bullet', 'assets/bug_1.png');
}

function create() {
    // Create the player sprite and set its position
    player = this.physics.add.sprite(400, 300, 'player');
    
    this.cameras.main.setBackgroundColor('aaeeff');
    var hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x000000, 0.5);
    hpBarBg.fillRect(300, 550, hpBarWidth, hpBarHeight);

    hpBar = this.add.graphics();
    updateHPBar();


    // Create a group for bullets
    bullets = this.physics.add.group();

    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();

    // Display the score
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // Collide the player and bullets
    //this.physics.add.collider(player, bullets, gameOver, null, this);
    this.physics.add.collider(player, bullets, Boom, null, this);

    // Spawn bullets every 1 second from different sides
    this.time.addEvent({
        delay: 200,
        callback: spawnBullet,
        callbackScope: this,
        loop: true
    });
}

function update() {
    // Move the player based on keyboard input
    if (cursors.left.isDown) {
        player.setVelocityX(-300);
    } 
    if (cursors.right.isDown) {
        player.setVelocityX(300);
    }
    if (cursors.down.isDown) {
        player.setVelocityY(300);
    }
    if (cursors.up.isDown) {
    player.setVelocityY(-300);
    }
    if (!cursors.left.isDown && !cursors.right.isDown && !cursors.up.isDown && !cursors.down.isDown) {
        player.setVelocityX(0);
        player.setVelocityY(0);
    }

    // Check for bullet-player collisions
   // this.physics.overlap(player, bullets, collectBullet, null, this);
}

function spawnBullet() {
    // Generate a random side from which the bullet will approach (1: top, 2: bottom, 3: left, 4: right)
    var side = Phaser.Math.Between(1, 4);

    var x, y, velocityX, velocityY;

    switch (side) {
        case 1: // Top side
            x = Phaser.Math.Between(50, 750);
            y = 0;
            velocityX = 0;
            velocityY = 250;
            break;
        case 2: // Bottom side
            x = Phaser.Math.Between(50, 750);
            y = 600;
            velocityX = 0;
            velocityY = -250;
            break;
        case 3: // Left side
            x = 0;
            y = Phaser.Math.Between(50, 550);
            velocityX = 250;
            velocityY = 0;
            break;
        case 4: // Right side
            x = 800;
            y = Phaser.Math.Between(50, 550);
            velocityX = -250;
            velocityY = 0;
            break;
    }

    // Create a new bullet sprite at the specified position and velocity
    var bullet = bullets.create(x, y, 'bullet');
    bullet.setVelocity(velocityX, velocityY);
}

function collectBullet(player, bullet) {
    // Remove the bullet from the screen
    bullet.disableBody(true, true);

    // Increment the score
    score += 10;
    scoreText.setText('Score: ' + score);
}

function updateHPBar() {
    // Clear the HP bar
    hpBar.clear();

    // Calculate the width of the HP bar based on the current HP
    var hpBarWidthCurrent = (currentHP / maxHP) * hpBarWidth;

    // Draw the HP bar
    hpBar.fillStyle(0xff0000);
    hpBar.fillRect(300, 550, hpBarWidthCurrent, hpBarHeight);
}


function gameOver() {
    // Display game over text
    this.add.text(300, 300, 'Game Over', { fontSize: '64px', fill: '#000' });
    // Pause the game
    this.physics.pause();
    this.time.removeAllEvents();
    this.input.on('pointerdown', () => {
        this.scene.restart();
    })
}

function Boom() {
    currentHP -= 10;
    updateHPBar();
    if (currentHP <= 0 ) {
        currentHP = maxHP;
        // Display game over text
        this.add.text(300, 300, 'Game Over', { fontSize: '64px', fill: '#000' });
        // Pause the game
        this.physics.pause();
        this.time.removeAllEvents();
        this.input.on('pointerdown', () => {
            this.scene.restart();
        })
    }
}