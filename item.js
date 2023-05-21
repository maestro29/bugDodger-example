// item.js

class Item {
    constructor(x, y, imageKey) {
      this.x = x;
      this.y = y;
      this.imageKey = imageKey;
      this.sprite = null;
    }
  
    create(game) {
      this.sprite = game.add.sprite(this.x, this.y, this.imageKey);
      // 아이템의 추가 설정이 필요한 경우 여기에 작성합니다.
    }
  
    // 아이템에 대한 추가 동작이 필요한 경우 메서드를 추가할 수 있습니다.
    move(x, y) {
      this.sprite.x += x;
      this.sprite.y += y;
    }
}