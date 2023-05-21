

var maxWidth = 1024;
var maxHeight = 768;
var winWidth = window.innerWidth;
var winHeight = window.innerHeight;

if (winWidth > maxWidth)
{
    winHeight = winHeight * (maxWidth / winWidth);
    winWidth = maxWidth;
}
else if (winHeight > maxHeight)
{
    winWidth = winWidth * (maxHeight / winHeight);
    winHeight = maxHeight;
}

// 아이템 객체 생성
var item = new Item(100, 200, 'itemImage');

// Phaser 게임 인스턴스 생성
var config = {
    type: Phaser.AUTO,
    width: winWidth,
    height: winHeight,
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
    },
    scale: {
        mode: Phaser.Scale.FULLSCREEN,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 케릭터 이동 속도 설정
var characterSpeed = 200;
let itemEffectActive = false;

var hpBar;
var hpBarBg;
var hpBarWidth = 70;
var hpBarHeight = 10;
var maxHP = 100;
var currentHP = maxHP;
var camera;
var character;
var scoreText;
var killCount = 0;
var dragStartPosition;
var isDragging = false;
var keys;
var stealHPEffect = false;

var tileSpriteWidth = 1200;
var tileSpriteHeight = 900;

var stage1MonsterMax = 30;
var stage2MonsterMax = 60;
var stageCleared = true;
var stageText;
var monsterGenCount = 0;

var game = new Phaser.Game(config);


// 게임에 필요한 이미지나 리소스를 로드하는 부분
function preload() {
    this.load.image('character', 'assets/codey.png');
    this.load.image('monster', 'assets/bug_1.png');
    this.load.image('background', 'assets/sky.png'); // 배경 이미지 로드
    this.load.image('bullet', 'assets/bomb.png'); // 총알 이미지 로드
    this.load.image('item', 'assets/star.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
}

// 게임 시작 시 초기화 및 객체 배치하는 부분
function create() {

    // 배경 이미지 추가
    //this.add.image(800, 600, 'background');
    this.add.tileSprite(0,0,tileSpriteWidth,tileSpriteHeight,'background');
    

    this.character = this.physics.add.sprite(0, 0, 'dude');
    character = this.character;
    
    this.monsters = this.physics.add.group();
    this.bullets = this.physics.add.group(); // 총알 그룹 추가
    this.items = this.physics.add.group(); // 아이템 그룹 생성
    camera = this.cameras.main;
    this.cameras.main.startFollow(this.character);

    hpBarBg = this.add.graphics();
    hpBar = this.add.graphics();
    scoreText = this.add.text(0, 0, '0 Kills', { fontSize: '24px', fill: '#000' });
    stageText = this.add.text(character.x-120, character.y, '', { fontSize: '64px', fill: '#000' });

    updateHPBar();

    //character.setInteractive();
    // 마우스 버튼 다운 이벤트 리스너를 추가합니다.
    this.input.on('pointerdown', function (pointer) {
        isDragging = true;
        dragStartPosition = { x: pointer.x, y: pointer.y }; // 드래그 시작 위치를 저장합니다.
    });

    // 마우스 버튼 업 이벤트 리스너를 추가합니다.
    this.input.on('pointerup', function () {
        isDragging = false;
    });


    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //createMonsters.call(this);
    // 타이머를 이용하여 일정 간격으로 몬스터 생성
    this.monsterTimer = this.time.addEvent({
        delay: 2000, // 밀리초마다 실행
        loop: true,
        callback: createMonsters,
        callbackScope: this,
        paused: true
    });


    // 몬스터들끼리 충돌 감지 설정
    this.physics.add.collider(this.monsters);
    // 케릭터와 몬스터간 충돌 감지 설정
    this.physics.add.collider(this.character, this.monsters, onCollision, null, this);
    // 총알 그룹과 몬스터 그룹 간 충돌 감지 설정
    this.physics.add.overlap(this.bullets, this.monsters, onBulletHit, null, this);
    // 아이템 획득 시 호출되는 함수
    this.physics.add.collider(this.character, this.items, onItemPickup, null, this);

    // 아이템 드롭 확률
    this.itemDropChance = 0.2; // 20%의 확률로 아이템 드롭

    // 아이템 효과 지속 시간
    this.itemEffectDuration = 5000; // 5초

    // 효과 지속 시간 타이머
    this.itemEffectTimer = null;

    keys = this.input.keyboard.addKeys("W,A,S,D");
}

// 게임 루프에서 매 프레임마다 실행되는 부분
function update(time) {

    // 몬스터들이 케릭터를 향해 달려오는 로직
    this.monsters.children.iterate(function (monster) {
        var angle = Phaser.Math.Angle.Between(monster.x, monster.y, this.character.x, this.character.y);
        var velocity = new Phaser.Math.Vector2();
        velocity.setToPolar(angle, 100);
        monster.setVelocity(velocity.x, velocity.y);
    }, this);

    // 케릭터와 가장 가까운 몬스터에게 총알 발사
    var closestMonster = findClosestMonster.call(this);
    if (closestMonster) {
        if (!this.lastBulletTime || (time - this.lastBulletTime) > 1000) {
            var bullet = createBullet.call(this, this.character.x, this.character.y);
            if (itemEffectActive){
                bullet.setTint(0xFF0000);
            }
            this.physics.moveToObject(bullet, closestMonster, 300);
            this.lastBulletTime = time;
        }
    }


    // 방향키 입력을 감지하여 케릭터 이동
    var keyboard = this.input.keyboard.createCursorKeys();
    var cursor = this.input.activePointer;

    if (keys.A.isDown || (isDragging && cursor.x < dragStartPosition.x-20)) {
        this.character.setVelocityX(-characterSpeed);
        this.character.anims.play('left', true);
    } else if (keys.D.isDown || (isDragging && cursor.x > dragStartPosition.x+20)) {
        this.character.setVelocityX(characterSpeed);
        this.character.anims.play('right', true);
    } else {
        this.character.setVelocityX(0);
        this.character.anims.play('turn');
    }
  
    if (keys.W.isDown || (isDragging && cursor.y < dragStartPosition.y-20)) {
        this.character.setVelocityY(-characterSpeed);
    } else if (keys.S.isDown || (isDragging && cursor.y > dragStartPosition.y+20)) {        
        this.character.setVelocityY(characterSpeed);
    } else {
        this.character.setVelocityY(0);
    }

    // 배경이미지 벗어나지 않도록 바운드 처리
    if (character.x < -(tileSpriteWidth - character.width) / 2)
        character.x = -(tileSpriteWidth - character.width) / 2;
    else if (character.x > (tileSpriteWidth - character.width) / 2)
        character.x = (tileSpriteWidth - character.width) / 2;
    if (character.y < -(tileSpriteHeight - character.height) / 2)
        character.y = -(tileSpriteHeight - character.height) / 2;
    else if (character.y > (tileSpriteHeight - character.height) / 2)
        character.y = (tileSpriteHeight - character.height) / 2;        

    updateHPBar();
    stageUpdate();
}

// 랜덤 위치에 몬스터 생성하는 함수
function createMonsters() {
    if (monsterGenCount < stage1MonsterMax){
        for (var i = 0; i < 3; i++) {        
            var radius = 400;//Phaser.Math.Between(400, 500); // 원의 반지름
            var angle = Math.random() * Math.PI * 2; // 0부터 2π(360도) 사이의 무작위 각도
            var offsetX = Math.cos(angle) * radius;
            var offsetY = Math.sin(angle) * radius;
            var x = character.x + offsetX;
            var y = character.y + offsetY;

            createMonster.call(this, x, y);
            monsterGenCount++;
        }
    }
}

// 위치에 따라 몬스터 생성하는 함수
function createMonster(x, y) {
    var monster = this.physics.add.sprite(x, y, 'monster');
    this.monsters.add(monster);
}

// 충돌 감지 시 호출되는 함수
function onCollision(character, monster) {
    // 충돌 시 케릭터와 몬스터의 동작 처리 등을 수행할 수 있습니다.
    
    if (currentHP > 0 ){
        currentHP -= 1;
        character.setTint(0xFF0000);
        // 일정 시간이 지난 후에 Tint 제거
        setTimeout(function() {
            character.clearTint();
        }, 200); // 0.2초 후에 Tint 제거
    }

    if (currentHP <= 0 ) {
        //currentHP = maxHP;
        // Display game over text
        this.add.text(character.x-160, character.y, 'Game Over', { fontSize: '64px', fill: '#000' });
        // Pause the game
        this.physics.pause();
        this.time.removeAllEvents();
    }
}

// 가장 가까운 몬스터를 찾는 함수
function findClosestMonster() {
    var closestMonster = null;
    var closestDistance = Infinity;

    this.monsters.children.iterate(function (monster) {
        var distance = Phaser.Math.Distance.Between(this.character.x, this.character.y, monster.x, monster.y);
        if (distance < closestDistance) {
            closestMonster = monster;
            closestDistance = distance;
        }
    }, this);

    return closestMonster;
}

// 총알을 생성하는 함수
function createBullet(x, y) {
    var bullet = this.physics.add.sprite(x, y, 'bullet');
    this.bullets.add(bullet);
    return bullet;
}


// 아이템을 생성하는 함수
function createItem(x, y) {
    //var item = this.physics.add.sprite(x, y, 'item');
    var item = game.scene.scenes[0].physics.add.sprite(x, y, 'item');

    if (Math.random() < 0.5){
        // 관통 총알
        item.itemType = 'pierce';
        item.setTint(0x00ff00);
    }
    else {
        item.itemType = 'stealHP'
    }
    //this.items.add(item);
    game.scene.scenes[0].items.add(item);
    return item;
}

// 총알과 몬스터의 충돌 시 호출되는 함수
function onBulletHit(bullet, monster) {

    killCount++;

    if (itemEffectActive) { // 총알에 아이템 효과가 있는 경우
        monster.destroy();
    } else {
        bullet.destroy();
        this.tweens.add({
            targets: monster,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: function () {
                monster.destroy(); // 몬스터 제거
            }
        });
        //monster.destroy();
    }

    // 흡혈 아이템을 먹어서 흡혈 스킬을 획득했다면,
    if (stealHPEffect && currentHP < maxHP)
        currentHP++;        
    
    // 일정 확률로 아이템 드롭
    // if (Phaser.Math.RND.frac() < this.itemDropChance) {
    //     createItem.call(this, monster.x, monster.y);
    // }
}

// 아이템 획득 시 호출되는 함수
function onItemPickup(character, item) {
    item.destroy();
    if (item.itemType === 'stealHP'){
        stealHPEffect = true;
    }
    applyItemEffect.call(this);
}

// 아이템 효과 적용 함수
function applyItemEffect() {
    // 이미 효과가 적용 중인 경우 무시
    if (this.itemEffectTimer !== null) {
        return;
    }

    // 효과 적용
    itemEffectActive = true;
    this.itemEffectTimer = this.time.delayedCall(this.itemEffectDuration, removeItemEffect, [], this);

    // 추가로 구현할 효과를 여기에 작성

}

// 아이템 효과 해제 함수
function removeItemEffect() {
    this.itemEffectTimer = null;

    itemEffectActive = false;
}

function updateHPBar() {
    // Clear the HP bar
    hpBarBg.clear();
    hpBar.clear();

    // Calculate the width of the HP bar based on the current HP
    var hpBarWidthCurrent = (currentHP / maxHP) * hpBarWidth;
    
    // Draw the HP bar
    hpBarBg.fillStyle(0x000000, 0.3);
    hpBarBg.fillRect(character.x-35, character.y+30, hpBarWidth, hpBarHeight);
    hpBar.fillStyle(0xff0000, 0.8);
    hpBar.fillRect(character.x-35, character.y+30, hpBarWidthCurrent, hpBarHeight);
    
    scoreText.x = character.x-60;
    scoreText.y = character.y-60;
    scoreText.setText(`${killCount} Kills`);
}

function stageUpdate()
{
    // 스테이지가 클리어 됐다면,
    if (stageCleared)
    {
        itemSpawn();
        let stageTextVisible = true;
        stageCleared = false;
        stageText.setText('Stage 1');
        stageText.visible = true;
        const blinkInterval = setInterval(() => {
            stageTextVisible = !stageTextVisible;
            stageText.visible = stageTextVisible;
        }, 500); // 0.5초 간격으로 깜빡이도록 설정

        game.scene.scenes[0].time.delayedCall(2500, ()=>{
            clearInterval(blinkInterval);
            stageText.visible = false;
            game.scene.scenes[0].monsterTimer.paused = false;
        });
    }

    // 스테이지 클리어
    if (killCount === stage1MonsterMax)
    {
        stageCleared = true;
        game.scene.scenes[0].monsterTimer.paused = true;
        killCount = 0;
        monsterGenCount = 0;
    }
}

function itemSpawn()
{
    createItem(-200,-200);
    createItem(0,-200);
    createItem(200,-200);
    createItem(-200,200);
    createItem(0,200);
    createItem(200,200);
}