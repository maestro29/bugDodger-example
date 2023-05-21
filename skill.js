
// 스킬
class Skill {
    constructor (){
        
    }

}

// 공격 스킬
class AttackingSkill extends Skill {
    constructor(range, damage, cooltime) {
        super();
        
        this.range = range; // 사정거리
        this.damange = damage; // 데미지
        this.cooltime = cooltime; // 쿨타임
        
    }

}

// 패시브 스킬
class PassiveSkill extends Skill {

}

// 근접 공격 스킬
// class MeleeAttackingSkill extends AttackingSkill {

// }

// 원거리 공격 스킬
// class RangeAttackingSkill extends AttackingSkill {

// }

// 튀는 미사일
class BouncingMissile extends AttackingSkill {
    
}